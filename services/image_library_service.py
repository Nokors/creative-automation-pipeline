"""
Image Library Service

Manages a library of uploaded images that can be used across campaigns.
"""
import os
import uuid
import mimetypes
from pathlib import Path
from typing import Optional, List, Dict
from PIL import Image

from config import get_settings

settings = get_settings()

# Supported image MIME types
SUPPORTED_MIME_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


class ImageLibraryService:
    """Service for managing image library"""
    
    def __init__(self):
        self.upload_dir = settings.upload_path
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure upload directories exist"""
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(os.path.join(self.upload_dir, 'thumbnails'), exist_ok=True)
    
    def get_image_info(self, filename: str) -> Optional[Dict]:
        """
        Get information about an image file
        
        Args:
            filename: Name of the image file
            
        Returns:
            Dictionary with image information or None if file doesn't exist
        """
        file_path = os.path.join(self.upload_dir, filename)
        
        if not os.path.exists(file_path):
            return None
        
        file_stat = os.stat(file_path)
        mime_type, _ = mimetypes.guess_type(filename)
        
        # Get image dimensions
        width, height = None, None
        try:
            with Image.open(file_path) as img:
                width, height = img.size
        except Exception:
            pass
        
        return {
            'filename': filename,
            'file_size': file_stat.st_size,
            'mime_type': mime_type,
            'width': width,
            'height': height,
            'uploaded_at': file_stat.st_ctime,
        }
    
    def list_images(self) -> List[Dict]:
        """
        List all images in the upload directory
        
        Returns:
            List of dictionaries with image information
        """
        images = []
        
        if not os.path.exists(self.upload_dir):
            return images
        
        for filename in os.listdir(self.upload_dir):
            file_path = os.path.join(self.upload_dir, filename)
            
            # Skip directories and thumbnails folder
            if os.path.isdir(file_path):
                continue
            
            # Check if it's an image
            mime_type, _ = mimetypes.guess_type(filename)
            if mime_type and mime_type in SUPPORTED_MIME_TYPES:
                info = self.get_image_info(filename)
                if info:
                    images.append(info)
        
        # Sort by upload time (newest first)
        images.sort(key=lambda x: x['uploaded_at'], reverse=True)
        
        return images
    
    async def save_upload(self, file_content: bytes, original_filename: str) -> Dict:
        """
        Save uploaded file to disk
        
        Args:
            file_content: File content bytes
            original_filename: Original filename
            
        Returns:
            Dictionary with saved file information
        """
        # Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB")
        
        # Generate unique filename
        file_ext = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())[:8]
        stored_filename = f"{Path(original_filename).stem}_{unique_id}{file_ext}"
        file_path = os.path.join(self.upload_dir, stored_filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Get image info
        info = self.get_image_info(stored_filename)
        
        # Create thumbnail
        try:
            self._create_thumbnail(file_path, stored_filename)
        except Exception as e:
            print(f"Warning: Could not create thumbnail: {e}")
        
        return info
    
    def _create_thumbnail(self, file_path: str, filename: str) -> None:
        """
        Create a thumbnail for the image
        
        Args:
            file_path: Path to original image
            filename: Filename to use for thumbnail
        """
        thumbnail_size = (200, 200)
        thumbnail_path = os.path.join(self.upload_dir, 'thumbnails', filename)
        
        with Image.open(file_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path, optimize=True, quality=85)
    
    def get_image_path(self, filename: str) -> str:
        """Get full path to image file"""
        return os.path.join(self.upload_dir, filename)
    
    def get_thumbnail_path(self, filename: str) -> str:
        """Get full path to thumbnail"""
        return os.path.join(self.upload_dir, 'thumbnails', filename)
    
    def image_exists(self, filename: str) -> bool:
        """Check if image exists"""
        return os.path.exists(self.get_image_path(filename))


# Singleton instance
image_library = ImageLibraryService()

