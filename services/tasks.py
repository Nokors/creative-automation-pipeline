from celery import Task
from services.celery_app import celery_app
from datetime import datetime
from pathlib import Path
from typing import Dict

from api.database import get_db_context
from api.models import Campaign, CampaignStatus
from services.image_service import ImageProcessor
from services.adobe_firefly_service import AdobeFireflyService
from services.exceptions import (
    RetryableError,
    NonRetryableError,
    ImageNotFoundError,
    InvalidImageError,
    ConfigurationError
)


class DatabaseTask(Task):
    """Base task with database session management"""
    _db = None
    
    def after_return(self, *args, **kwargs):
        """Clean up after task completion"""
        if self._db is not None:
            self._db.close()


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name='services.tasks.process_campaign_task',
    autoretry_for=(RetryableError,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True
)
def process_campaign_task(self, campaign_id: str) -> Dict:
    """
    Process campaign asynchronously with automatic retry mechanism
    
    This task:
    1. Retrieves the campaign from database
    2. Generates or downloads the image based on metadata
    3. Creates image variations (1:1, 9:16, 16:9)
    4. Updates campaign with processed images
    5. Marks campaign as completed or failed
    
    Retry Configuration:
    - Only retries on transient/retryable errors (network issues, timeouts, etc.)
    - Does NOT retry on permanent errors (file not found, validation errors, etc.)
    - Max retries: 3 attempts
    - Exponential backoff with jitter
    - Max backoff: 600 seconds (10 minutes)
    
    Args:
        campaign_id: ID of the campaign to process
        
    Returns:
        Dictionary with processing results
    """
    retry_num = self.request.retries
    try:
        # Get database session
        with get_db_context() as db:
            # Fetch campaign
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            
            if not campaign:
                raise Exception(f"Campaign {campaign_id} not found")
            
            # Update status to processing
            campaign.status = CampaignStatus.PROCESSING
            db.commit()
            
            if retry_num > 0:
                print(f"🔄 Processing campaign {campaign_id}... (Retry attempt {retry_num}/3)")
            else:
                print(f"🔄 Processing campaign {campaign_id}...")
            
            # Get image metadata
            image_metadata = campaign.image_metadata
            generate_by_ai = campaign.generate_by_ai == 'true'
            
            # Extract product SKUs from campaign (used for folder naming)
            product_skus = []
            if campaign.products:
                for product in campaign.products:
                    if isinstance(product, dict) and 'sku' in product:
                        product_skus.append(product['sku'])
            
            # Initialize services
            image_processor = ImageProcessor()
            
            # Handle AI image generation
            if generate_by_ai and image_metadata.get('source_type') == 'ai_generated':
                print(f"🎨 Generating AI image for campaign {campaign_id}...")
                
                ai_service = AdobeFireflyService()
                ai_prompt = image_metadata.get('ai_prompt')
                
                if not ai_prompt:
                    raise ValueError("AI prompt is required for AI-generated images")
                
                # Generate image using Adobe Firefly
                generated_path = ai_service.generate_with_fallback(
                    prompt=ai_prompt,
                    campaign_id=campaign_id,
                    product_skus=product_skus
                )
                
                if not generated_path:
                    raise Exception("Failed to generate AI image")
                
                # Update metadata with generated path
                image_metadata['generated_path'] = str(generated_path)
                campaign.image_metadata = image_metadata
                db.commit()
                
                print(f"✅ AI image generated: {generated_path}")
            
            # Process image and create variations
            print(f"🖼️  Creating image variations for campaign {campaign_id}...")
            
            variations = image_processor.process_image(
                image_metadata=image_metadata,
                campaign_id=campaign_id,
                product_skus=product_skus
            )
            
            # Brand color validation (runs AFTER images are resized)
            brand_validation_status = 'not_validated'
            brand_validation_message = ''
            brand_validation_details = None
            
            try:
                from services.brand_validator import get_brand_validator
                from config import get_settings
                
                settings = get_settings()
                
                if settings.enable_brand_validation:
                    print(f"🎨 Validating brand color compliance for campaign {campaign_id}...")
                    
                    brand_validator = get_brand_validator()
                    
                    # Validate the RESIZED processed image (ratio_1_1)
                    # This validates the actual image that will be used, not the source
                    if variations.get('ratio_1_1'):
                        storage_base = Path(settings.storage_path)
                        image_path = storage_base / variations['ratio_1_1']
                        
                        # Verify the resized image file exists before validation
                        if not image_path.exists():
                            raise FileNotFoundError(f"Resized image not found at {image_path}")
                        
                        print(f"   Validating resized image: {variations['ratio_1_1']}")
                        
                        validation_result = brand_validator.validate_campaign_image(
                            image_path=image_path,
                            skip_if_disabled=False
                        )
                        
                        brand_validation_details = validation_result
                        
                        if validation_result.get('skipped'):
                            brand_validation_status = 'skipped'
                            brand_validation_message = validation_result.get('message', 'Brand validation skipped')
                        elif validation_result.get('is_compliant'):
                            brand_validation_status = 'passed'
                            brand_validation_message = validation_result.get('message', 'Brand colors compliant')
                        else:
                            brand_validation_status = 'warning'
                            brand_validation_message = validation_result.get('message', 'Brand colors may not be compliant')
                        
                        print(f"✅ Brand validation: {brand_validation_status} - {brand_validation_message}")
                        if validation_result.get('compliance_percentage') is not None:
                            print(f"   Compliance: {validation_result['compliance_percentage']}%")
                        if validation_result.get('brand_color_matches'):
                            print(f"   Matched Brand Colors: {', '.join(validation_result['brand_color_matches'])}")
                    else:
                        brand_validation_status = 'error'
                        brand_validation_message = 'No resized images available for validation'
                        print(f"⚠️  Brand validation skipped: No processed images found")
                else:
                    brand_validation_status = 'skipped'
                    brand_validation_message = 'Brand validation is disabled'
                    print(f"⏭️  Brand validation skipped (disabled)")
            
            except Exception as brand_error:
                # Don't fail campaign if brand validation fails
                brand_validation_status = 'error'
                brand_validation_message = f'Brand validation error: {str(brand_error)}'
                print(f"⚠️  Brand validation error: {str(brand_error)}")
                import traceback
                print(f"   Traceback: {traceback.format_exc()}")
            
            # Update campaign with processed images and brand validation
            campaign.processed_images = variations
            campaign.status = CampaignStatus.COMPLETED
            campaign.completed_at = datetime.utcnow()
            campaign.error_message = None
            
            # Store brand validation in dedicated columns (NEW)
            campaign.brand_validation_status = brand_validation_status
            campaign.brand_validation_message = brand_validation_message
            campaign.brand_validation_result = brand_validation_details
            
            # Also store in item_metadata for backward compatibility
            if campaign.item_metadata is None:
                campaign.item_metadata = {}
            campaign.item_metadata['brand_validation'] = {
                'status': brand_validation_status,
                'message': brand_validation_message,
                'details': brand_validation_details
            }
            
            db.commit()
            
            print(f"✅ Campaign {campaign_id} processed successfully!")
            print(f"   Generated variations: {list(variations.keys())}")
            
            # Auto-upload to Dropbox if enabled
            if campaign.auto_upload_to_dropbox == 'true':
                print(f"☁️  Auto-uploading to Dropbox...")
                try:
                    from services.dropbox_upload_service import get_dropbox_service
                    from config import get_settings
                    
                    settings = get_settings()
                    dropbox_service = get_dropbox_service()
                    
                    if dropbox_service.is_configured():
                        storage_base = Path(settings.storage_path)
                        upload_results = dropbox_service.upload_campaign_images(
                            campaign_id=campaign_id,
                            image_paths=variations,
                            storage_base_path=storage_base
                        )
                        
                        # Check if all uploads succeeded
                        all_succeeded = all(result.get('success', False) for result in upload_results.values())
                        
                        if all_succeeded:
                            campaign.dropbox_uploaded = 'true'
                            campaign.dropbox_links = upload_results
                            db.commit()
                            print(f"✅ Campaign images uploaded to Dropbox successfully!")
                        else:
                            failed_ratios = [ratio for ratio, result in upload_results.items() if not result.get('success', False)]
                            print(f"⚠️  Some images failed to upload to Dropbox: {failed_ratios}")
                    else:
                        print(f"⚠️  Dropbox auto-upload enabled but not configured. Skipping upload.")
                except Exception as dropbox_error:
                    # Don't fail the entire campaign if Dropbox upload fails
                    print(f"⚠️  Dropbox upload failed: {str(dropbox_error)}")
                    print(f"   Campaign processing completed, but Dropbox upload failed. You can manually upload later.")
            
            return {
                "campaign_id": campaign_id,
                "status": "completed",
                "variations": variations,
                "message": "Campaign processed successfully"
            }
            
    except NonRetryableError as e:
        # Permanent error - fail immediately without retry
        error_message = str(e)
        error_type = type(e).__name__
        print(f"❌ Campaign {campaign_id} failed with permanent error ({error_type}): {error_message}")
        print(f"   This error cannot be resolved by retrying.")
        
        # Update campaign with error status
        try:
            with get_db_context() as db:
                campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                if campaign:
                    campaign.status = CampaignStatus.FAILED
                    campaign.error_message = f"Permanent error ({error_type}): {error_message}"
                    campaign.completed_at = datetime.utcnow()
                    db.commit()
        except Exception as db_error:
            print(f"❌ Failed to update campaign status: {str(db_error)}")
        
        # Don't re-raise - task is complete (failed)
        return {
            "campaign_id": campaign_id,
            "status": "failed",
            "error": error_message,
            "error_type": error_type
        }
    
    except RetryableError as e:
        # Transient error - retry with backoff
        error_message = str(e)
        retry_num = self.request.retries
        max_retries = self.max_retries
        
        # Check if we have retries left
        if retry_num < max_retries:
            print(f"⚠️  Transient error processing campaign {campaign_id} (attempt {retry_num + 1}/{max_retries + 1}): {error_message}")
            print(f"🔄 Will retry with exponential backoff...")
            
            # Update campaign with retry information (but don't mark as failed yet)
            try:
                with get_db_context() as db:
                    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                    if campaign:
                        campaign.error_message = f"Retry {retry_num + 1}/{max_retries + 1}: {error_message}"
                        db.commit()
            except Exception as db_error:
                print(f"❌ Failed to update retry info: {str(db_error)}")
            
            # Re-raise for automatic retry
            raise
        else:
            # Final failure - no more retries
            print(f"❌ Campaign {campaign_id} failed after {max_retries + 1} retry attempts: {error_message}")
            
            # Update campaign with final error status
            try:
                with get_db_context() as db:
                    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                    if campaign:
                        campaign.status = CampaignStatus.FAILED
                        campaign.error_message = f"Failed after {max_retries + 1} retry attempts: {error_message}"
                        campaign.completed_at = datetime.utcnow()
                        db.commit()
            except Exception as db_error:
                print(f"❌ Failed to update campaign status: {str(db_error)}")
            
            # Re-raise exception
            raise
    
    except Exception as e:
        # Unexpected error - treat as non-retryable
        error_message = str(e)
        error_type = type(e).__name__
        print(f"❌ Campaign {campaign_id} failed with unexpected error ({error_type}): {error_message}")
        
        # Update campaign with error status
        try:
            with get_db_context() as db:
                campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                if campaign:
                    campaign.status = CampaignStatus.FAILED
                    campaign.error_message = f"Unexpected error ({error_type}): {error_message}"
                    campaign.completed_at = datetime.utcnow()
                    db.commit()
        except Exception as db_error:
            print(f"❌ Failed to update campaign status: {str(db_error)}")
        
        # Don't re-raise - task is complete (failed)
        return {
            "campaign_id": campaign_id,
            "status": "failed",
            "error": error_message,
            "error_type": error_type
        }


@celery_app.task(name='services.tasks.cleanup_old_files')
def cleanup_old_files(days: int = 30) -> Dict:
    """
    Clean up old campaign files (optional maintenance task)
    
    Args:
        days: Delete files older than this many days
        
    Returns:
        Dictionary with cleanup results
    """
    from datetime import timedelta
    import os
    
    try:
        from config import get_settings
        settings = get_settings()
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        deleted_count = 0
        
        # Clean up old files in storage directories
        for directory in [settings.upload_path, settings.generated_path]:
            dir_path = Path(directory)
            if not dir_path.exists():
                continue
            
            for item in dir_path.rglob('*'):
                if item.is_file():
                    # Check file modification time
                    mtime = datetime.fromtimestamp(item.stat().st_mtime)
                    if mtime < cutoff_date:
                        item.unlink()
                        deleted_count += 1
        
        print(f"🧹 Cleanup complete: {deleted_count} files deleted")
        
        return {
            "status": "completed",
            "deleted_files": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        print(f"❌ Cleanup error: {str(e)}")
        raise

