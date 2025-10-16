import os
import shutil
import requests
from PIL import Image
from typing import Dict, Tuple
from pathlib import Path
from config import get_settings
import uuid
from services.exceptions import (
    ImageNotFoundError,
    InvalidImageError,
    NetworkError,
    ConfigurationError
)

settings = get_settings()


class ImageProcessor:
    """Service for processing and resizing images"""
    
    # Image aspect ratios to generate
    ASPECT_RATIOS = {
        "1_1": (1, 1),    
        "9_16": (9, 16),    
        "16_9": (16, 9),
    }
    
    # Standard sizes for each ratio
    STANDARD_SIZES = {
        "1_1": (1080, 1080),
        "9_16": (1080, 1920),
        "16_9": (1920, 1080),
    }
    
    def __init__(self):
        self.storage_path = Path(settings.storage_path)
        self.upload_path = Path(settings.upload_path)
        self.generated_path = Path(settings.generated_path)
    
    def download_from_url(self, url: str, destination: Path) -> Path:
        """
        Download image from URL
        
        Args:
            url: Image URL
            destination: Destination file path
            
        Returns:
            Path to downloaded file
        """
        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(destination, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return destination
        except requests.exceptions.Timeout:
            raise NetworkError(f"Timeout downloading image from URL: {url}")
        except requests.exceptions.ConnectionError:
            raise NetworkError(f"Connection error downloading image from URL: {url}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise ImageNotFoundError(f"Image not found at URL: {url}")
            elif e.response.status_code >= 500:
                raise NetworkError(f"Server error downloading image (status {e.response.status_code}): {url}")
            else:
                raise NetworkError(f"HTTP error downloading image: {str(e)}")
        except Exception as e:
            raise NetworkError(f"Failed to download image from URL: {str(e)}")
    
    
    def load_local_image(self, source_path: str, destination: Path) -> Path:
        """
        Copy local image to storage
        
        Args:
            source_path: Source image path (can be filename from library or full path)
            destination: Destination path
            
        Returns:
            Path to copied file
        """
        try:
            # Check if it's a filename from the library
            source = Path(source_path)
            
            # If it's just a filename (no path separators), look in upload path
            if not str(source_path).startswith('/') and '/' not in str(source_path):
                source = self.upload_path / source_path
            
            if not source.exists():
                raise ImageNotFoundError(
                    f"Source image not found: {source_path}. "
                    f"Please ensure the file exists in the upload directory or provide a valid path."
                )
            
            shutil.copy2(source, destination)
            return destination
        except ImageNotFoundError:
            # Re-raise ImageNotFoundError as-is
            raise
        except Exception as e:
            raise InvalidImageError(f"Failed to load local image: {str(e)}")
    
    def resize_image_to_ratio(
        self,
        image: Image.Image,
        target_ratio: Tuple[int, int],
        target_size: Tuple[int, int]
    ) -> Image.Image:
        """
        Resize and crop image to target aspect ratio
        
        Args:
            image: PIL Image object
            target_ratio: Target aspect ratio (width, height)
            target_size: Target size in pixels
            
        Returns:
            Resized PIL Image
        """
        # Calculate target aspect ratio
        target_aspect = target_ratio[0] / target_ratio[1]
        
        # Get current image dimensions
        img_width, img_height = image.size
        img_aspect = img_width / img_height
        
        # Calculate crop dimensions
        if img_aspect > target_aspect:
            # Image is wider than target, crop width
            new_width = int(img_height * target_aspect)
            new_height = img_height
            left = (img_width - new_width) // 2
            top = 0
            right = left + new_width
            bottom = img_height
        else:
            # Image is taller than target, crop height
            new_width = img_width
            new_height = int(img_width / target_aspect)
            left = 0
            top = (img_height - new_height) // 2
            right = img_width
            bottom = top + new_height
        
        # Crop image
        cropped = image.crop((left, top, right, bottom))
        
        # Resize to target size
        resized = cropped.resize(target_size, Image.Resampling.LANCZOS)
        
        return resized
    
    def create_variations(self, source_image_path: Path, campaign_id: str, product_skus: list = None) -> Dict[str, str]:
        """
        Create image variations for different aspect ratios
        
        Args:
            source_image_path: Path to source image
            campaign_id: Campaign ID for organizing files
            product_skus: List of product SKUs to include in folder name
            
        Returns:
            Dictionary mapping ratio names to file paths
        """
        try:
            # Open source image
            with Image.open(source_image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create campaign directory
                campaign_dir = self.generated_path / campaign_id
                campaign_dir.mkdir(parents=True, exist_ok=True)
                
                # Build SKU subfolder if provided
                sku_subfolder = None
                if product_skus and len(product_skus) > 0:
                    # Sanitize SKUs for filesystem (remove special characters)
                    sanitized_skus = []
                    for sku in product_skus:
                        # Keep only alphanumeric, hyphens, and underscores
                        sanitized = ''.join(c for c in str(sku) if c.isalnum() or c in ['-', '_'])
                        if sanitized:
                            sanitized_skus.append(sanitized)
                    
                    if sanitized_skus:
                        sku_subfolder = '_'.join(sanitized_skus)
                
                # Create SKU subdirectory if provided
                if sku_subfolder:
                    base_dir = campaign_dir / sku_subfolder
                else:
                    base_dir = campaign_dir
                base_dir.mkdir(parents=True, exist_ok=True)
                
                variations = {}
                
                # Generate each variation
                for ratio_name, ratio in self.ASPECT_RATIOS.items():
                    target_size = self.STANDARD_SIZES[ratio_name]
                    
                    # Resize image
                    resized_img = self.resize_image_to_ratio(img, ratio, target_size)
                    
                    # Create ratio-specific subdirectory
                    ratio_dir = base_dir / ratio_name
                    ratio_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Save variation in ratio folder
                    # Include SKU in filename if present
                    if sku_subfolder:
                        output_filename = f"{campaign_id}_{sku_subfolder}_{ratio_name}.jpg"
                    else:
                        output_filename = f"{campaign_id}_{ratio_name}.jpg"
                    output_path = ratio_dir / output_filename
                    resized_img.save(output_path, 'JPEG', quality=95, optimize=True)
                    
                    # Store relative path
                    relative_path = str(output_path.relative_to(self.storage_path))
                    variations[f"ratio_{ratio_name}"] = relative_path
                
                return variations
                
        except Exception as e:
            raise Exception(f"Failed to create image variations: {str(e)}")
    
    def process_image(
        self,
        image_metadata: dict,
        campaign_id: str,
        product_skus: list = None
    ) -> Dict[str, str]:
        """
        Process image based on metadata and create variations
        
        Args:
            image_metadata: Image metadata dictionary
            campaign_id: Campaign ID
            product_skus: List of product SKUs to include in folder name
            
        Returns:
            Dictionary with paths to all image variations
        """
        source_type = image_metadata.get('source_type')
        
        if not source_type:
            raise ConfigurationError("source_type is required in image_metadata")
        
        # Generate unique filename
        temp_filename = f"{campaign_id}_source_{uuid.uuid4().hex[:8]}.jpg"
        temp_path = self.upload_path / temp_filename
        
        try:
            # Download or load source image based on type
            if source_type == 'local':
                source_path = image_metadata.get('source_path')
                if not source_path:
                    raise ConfigurationError("source_path is required for local images")
                self.load_local_image(source_path, temp_path)
            elif source_type == 'ai_generated':
                # Source image should already be downloaded by AI service
                source_path = image_metadata.get('generated_path')
                if not source_path:
                    raise ConfigurationError("generated_path not found in metadata for AI generated image")
                if not Path(source_path).exists():
                    raise ImageNotFoundError(f"AI generated image not found at: {source_path}")
                temp_path = Path(source_path)
            else:
                raise ConfigurationError(f"Unknown source type: {source_type}")
            
            # Create variations
            variations = self.create_variations(temp_path, campaign_id, product_skus)
            
            return variations
            
        except (ImageNotFoundError, InvalidImageError, ConfigurationError):
            # Re-raise non-retryable errors as-is
            # Clean up temp file if it exists
            if temp_path.exists() and source_type != 'ai_generated':
                try:
                    temp_path.unlink()
                except:
                    pass
            raise
        except Exception as e:
            # Clean up temp file if it exists
            if temp_path.exists() and source_type != 'ai_generated':
                try:
                    temp_path.unlink()
                except:
                    pass
            raise e

