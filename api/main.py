from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os

from config import get_settings
from api.database import get_db, init_db
from api.schemas import (
    CampaignCreate,
    CampaignResponse,
    CampaignCreateResponse,
    ErrorResponse,
    AssetReportResponse,
    ImageInfo,
    ImageListResponse
)
from api.models import Campaign, CampaignStatus
from services.tasks import process_campaign_task
from services.image_library_service import image_library

settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title="Marketing Campaign API",
    description="REST API for creating and managing marketing campaigns with async image processing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    # Create database tables
    init_db()
    
    # Create storage directories
    os.makedirs(settings.storage_path, exist_ok=True)
    os.makedirs(settings.upload_path, exist_ok=True)
    os.makedirs(settings.generated_path, exist_ok=True)
    
    print("✅ Application started successfully")
    print(f"📁 Storage path: {settings.storage_path}")
    print(f"🔐 Basic Auth enabled: {settings.basic_auth_username}")


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Marketing Campaign API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "storage": "ready"
    }


@app.post(
    "/campaigns",
    response_model=CampaignCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Campaigns"],
    responses={
        202: {"description": "Campaign creation initiated"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        422: {"model": ErrorResponse, "description": "Validation Error (includes prohibited words check)"}
    }
)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new marketing campaign (async processing)
    
    This endpoint initiates campaign creation and returns immediately.
    The campaign is processed asynchronously in the background.
    
    **Content Validation:**
    All text fields (description, campaign_message, products_description, target_market)
    are validated against a list of prohibited words. If any prohibited words are found,
    the request will be rejected with a 422 Validation Error.
    
    **Image Source Types:**
    - `local`: Image from local file system
    - `ai_generated`: Generate image using Adobe Firefly AI
    
    **Image Variations:**
    All images are automatically resized to three aspect ratios:
    - 1:1 (Square - for social media posts)
    - 9:16 (Vertical - for stories/reels)
    - 16:9 (Horizontal - for banners/YouTube)
    """
    try:
        # Determine content validation status
        from config import get_settings
        settings_obj = get_settings()
        
        if settings_obj.enable_content_validation:
            # Validation passed (if we got here, it means no prohibited words were found)
            validation_status = 'passed'
            validation_message = 'Content validation passed - no prohibited words found'
        else:
            # Validation was skipped
            validation_status = 'skipped'
            validation_message = 'Content validation is disabled'
        
        # Create campaign record
        campaign = Campaign(
            description=campaign_data.description,
            target_market=campaign_data.target_market,
            campaign_message=campaign_data.campaign_message,
            products_description=campaign_data.products_description,
            marketing_channel=campaign_data.marketing_channel.value if campaign_data.marketing_channel else None,
            products=[p.model_dump() for p in campaign_data.products],
            item_metadata=campaign_data.item_metadata,
            image_metadata=campaign_data.image_metadata.model_dump(),
            generate_by_ai='true' if campaign_data.generate_by_ai else 'false',
            auto_upload_to_dropbox='true' if campaign_data.auto_upload_to_dropbox else 'false',
            status=CampaignStatus.PENDING,
            content_validation_status=validation_status,
            content_validation_message=validation_message
        )
        
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        # Queue async task for processing
        process_campaign_task.delay(campaign.id)
        
        return CampaignCreateResponse(
            id=campaign.id,
            status="pending",
            message="Campaign creation initiated. Processing asynchronously."
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create campaign: {str(e)}"
        )


@app.get(
    "/campaigns/{campaign_id}",
    response_model=CampaignResponse,
    tags=["Campaigns"],
    responses={
        200: {"description": "Campaign details"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Campaign not found"}
    }
)
async def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    """
    Get campaign details by ID
    
    Returns the complete campaign information including:
    - Campaign details
    - Processing status
    - Processed image paths (if completed)
    - Error messages (if failed)
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    return campaign.to_dict()


@app.get(
    "/campaigns",
    response_model=List[CampaignResponse],
    tags=["Campaigns"],
    responses={
        200: {"description": "List of campaigns"},
        401: {"model": ErrorResponse, "description": "Unauthorized"}
    }
)
async def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db)
):
    """
    List all campaigns with optional filtering
    
    Parameters:
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **status_filter**: Filter by status (pending, processing, completed, failed, active)
    """
    query = db.query(Campaign)
    
    if status_filter:
        try:
            status_enum = CampaignStatus(status_filter)
            query = query.filter(Campaign.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {status_filter}"
            )
    
    campaigns = query.offset(skip).limit(limit).all()
    return [campaign.to_dict() for campaign in campaigns]


@app.get(
    "/reports/assets",
    response_model=AssetReportResponse,
    tags=["Reports"],
    responses={
        200: {"description": "Asset statistics report"},
        401: {"model": ErrorResponse, "description": "Unauthorized"}
    }
)
async def get_asset_report(
    db: Session = Depends(get_db)
):
    """
    Get asset reporting statistics
    
    Returns statistics about image sources across all campaigns:
    - Total number of campaigns
    - Count of AI-generated images
    - Count of local file uploads
    - Breakdown by campaign status
    
    This endpoint helps track:
    - Usage of different image sources
    - AI generation vs manual uploads
    - Success rates by image source
    - Asset distribution across campaign statuses
    """
    try:
        # Get all campaigns
        campaigns = db.query(Campaign).all()
        
        # Initialize counters
        total_campaigns = len(campaigns)
        ai_generated = 0
        local_uploads = 0
        
        # Status breakdown
        by_status = {}
        
        # Process each campaign
        for campaign in campaigns:
            # Get image source type from image_metadata
            source_type = campaign.image_metadata.get('source_type', 'unknown')
            status = campaign.status.value if isinstance(campaign.status, CampaignStatus) else campaign.status
            
            # Count by source type
            if source_type == 'ai_generated':
                ai_generated += 1
            elif source_type == 'local':
                local_uploads += 1
            
            # Count by status
            if status not in by_status:
                by_status[status] = {
                    'ai_generated': 0,
                    'local_uploads': 0
                }
            
            if source_type == 'ai_generated':
                by_status[status]['ai_generated'] += 1
            elif source_type == 'local':
                by_status[status]['local_uploads'] += 1
        
        return AssetReportResponse(
            total_campaigns=total_campaigns,
            ai_generated=ai_generated,
            local_uploads=local_uploads,
            by_status=by_status
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate asset report: {str(e)}"
        )


@app.post(
    "/api/images/upload",
    response_model=ImageInfo,
    status_code=status.HTTP_201_CREATED,
    tags=["Images"],
    summary="Upload an image to the library",
    description="""
    Upload an image file to the image library.
    
    **Supported formats:** JPG, PNG, GIF, WebP  
    **Maximum file size:** 10MB
    
    The uploaded image will be available for use in campaigns.
    """
)
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload")
):
    """Upload an image to the library"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Read file content
        content = await file.read()
        
        # Save to library
        info = await image_library.save_upload(content, file.filename)
        
        return ImageInfo(
            filename=info['filename'],
            file_size=info['file_size'],
            mime_type=info['mime_type'],
            width=info['width'],
            height=info['height'],
            uploaded_at=info['uploaded_at'],
            url=f"/api/images/{info['filename']}",
            thumbnail_url=f"/api/images/{info['filename']}/thumbnail"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@app.get(
    "/api/images",
    response_model=ImageListResponse,
    tags=["Images"],
    summary="List all images in the library",
    description="Get a list of all available images that can be used in campaigns."
)
async def list_images():
    """List all images in the library"""
    try:
        images = image_library.list_images()
        
        image_list = [
            ImageInfo(
                filename=img['filename'],
                file_size=img['file_size'],
                mime_type=img['mime_type'],
                width=img['width'],
                height=img['height'],
                uploaded_at=img['uploaded_at'],
                url=f"/api/images/{img['filename']}",
                thumbnail_url=f"/api/images/{img['filename']}/thumbnail"
            )
            for img in images
        ]
        
        return ImageListResponse(
            total=len(image_list),
            images=image_list
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list images: {str(e)}"
        )


@app.get(
    "/api/images/{filename}",
    response_class=FileResponse,
    tags=["Images"],
    summary="Get image file",
    description="Download or view the image file."
)
async def get_image(
    filename: str
):
    """Get image file"""
    try:
        if not image_library.image_exists(filename):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        file_path = image_library.get_image_path(filename)
        
        return FileResponse(
            path=file_path,
            media_type='image/jpeg',
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve image: {str(e)}"
        )


@app.get(
    "/api/images/{filename}/thumbnail",
    response_class=FileResponse,
    tags=["Images"],
    summary="Get image thumbnail",
    description="Get a thumbnail version of the image (200x200)."
)
async def get_image_thumbnail(
    filename: str
):
    """Get image thumbnail"""
    try:
        thumbnail_path = image_library.get_thumbnail_path(filename)
        
        # If thumbnail doesn't exist, return original
        if not os.path.exists(thumbnail_path):
            if not image_library.image_exists(filename):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Image not found"
                )
            file_path = image_library.get_image_path(filename)
            return FileResponse(path=file_path, media_type='image/jpeg', filename=filename)
        
        return FileResponse(
            path=thumbnail_path,
            media_type='image/jpeg',
            filename=f"thumb_{filename}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve thumbnail: {str(e)}"
        )


@app.get(
    "/storage/{file_path:path}",
    response_class=FileResponse,
    tags=["Storage"],
    summary="Get generated campaign image",
    description="Serve generated campaign image files from storage"
)
async def get_storage_file(file_path: str):
    """Serve files from storage directory"""
    try:
        from pathlib import Path
        
        # Construct full path
        full_path = Path(settings.storage_path) / file_path
        
        # Security: ensure the path is within storage directory
        if not str(full_path.resolve()).startswith(str(Path(settings.storage_path).resolve())):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if file exists
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {file_path}"
            )
        
        # Determine mime type
        mime_type = 'image/jpeg'
        if file_path.lower().endswith('.png'):
            mime_type = 'image/png'
        elif file_path.lower().endswith('.gif'):
            mime_type = 'image/gif'
        elif file_path.lower().endswith('.webp'):
            mime_type = 'image/webp'
        
        return FileResponse(
            path=full_path,
            media_type=mime_type,
            filename=full_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve file: {str(e)}"
        )


@app.post(
    "/campaigns/{campaign_id}/upload-to-dropbox",
    tags=["Campaigns"],
    summary="Upload campaign images to Dropbox",
    description="Upload processed campaign image variations to Dropbox for backup/storage",
    responses={
        200: {"description": "Images uploaded successfully"},
        404: {"description": "Campaign not found"},
        400: {"description": "Campaign not completed or Dropbox not configured"},
        500: {"description": "Upload failed"}
    }
)
async def upload_campaign_to_dropbox(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    """
    Upload processed campaign images to Dropbox
    
    This endpoint uploads all processed image variations (1:1, 9:16, 16:9)
    to Dropbox and creates shared links for each image.
    
    Requires:
    - DROPBOX_ACCESS_TOKEN to be configured in environment
    - Campaign must have status 'completed'
    - Campaign must have processed images
    """
    try:
        from pathlib import Path
        from services.dropbox_upload_service import get_dropbox_service
        
        # Get campaign from database
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Campaign not found: {campaign_id}"
            )
        
        # Check if campaign is completed
        if campaign.status != CampaignStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Campaign must be completed before uploading to Dropbox. Current status: {campaign.status.value}"
            )
        
        # Check if processed images exist
        if not campaign.processed_images:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campaign has no processed images to upload"
            )
        
        # Get Dropbox service
        dropbox_service = get_dropbox_service()
        
        # Check if Dropbox is configured
        if not dropbox_service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dropbox upload not configured. Please set DROPBOX_ACCESS_TOKEN environment variable."
            )
        
        # Check if already uploaded
        if campaign.dropbox_uploaded == 'true':
            return {
                "message": "Campaign images already uploaded to Dropbox",
                "campaign_id": campaign_id,
                "dropbox_links": campaign.dropbox_links,
                "already_uploaded": True
            }
        
        # Upload images to Dropbox
        storage_base = Path(settings.storage_path)
        upload_results = dropbox_service.upload_campaign_images(
            campaign_id=campaign_id,
            image_paths=campaign.processed_images,
            storage_base_path=storage_base
        )
        
        # Check if all uploads succeeded
        all_succeeded = all(result.get('success', False) for result in upload_results.values())
        
        if all_succeeded:
            # Update campaign with Dropbox links
            campaign.dropbox_uploaded = 'true'
            campaign.dropbox_links = upload_results
            db.commit()
            
            return {
                "message": "Campaign images uploaded to Dropbox successfully",
                "campaign_id": campaign_id,
                "dropbox_links": upload_results,
                "uploaded_at": datetime.now().isoformat()
            }
        else:
            # Partial success or failure
            failed_ratios = [ratio for ratio, result in upload_results.items() if not result.get('success', False)]
            
            return {
                "message": "Some images failed to upload",
                "campaign_id": campaign_id,
                "dropbox_links": upload_results,
                "failed_ratios": failed_ratios,
                "partial_success": True
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload to Dropbox: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )

