"""
Dropbox Upload Service
Upload processed campaign images to Dropbox for storage/backup
"""

import os
from pathlib import Path
from typing import Dict, List, Optional
import requests
from config import get_settings

settings = get_settings()


class DropboxUploadService:
    """Service for uploading campaign images to Dropbox"""
    
    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize Dropbox upload service
        
        Args:
            access_token: Dropbox access token (optional, uses config if not provided)
        """
        self.access_token = access_token or settings.dropbox_access_token
        self.upload_url = "https://content.dropboxapi.com/2/files/upload"
        self.folder_path = getattr(settings, 'dropbox_folder_path', '/campaign-images')
    
    def upload_file(self, file_path: Path, dropbox_path: str) -> Dict:
        """
        Upload a single file to Dropbox
        
        Args:
            file_path: Local file path
            dropbox_path: Destination path in Dropbox
            
        Returns:
            Dictionary with upload result
        """
        if not self.access_token:
            raise ValueError("Dropbox access token not configured")
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Read file content
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': f'{{"path": "{dropbox_path}", "mode": "add", "autorename": true, "mute": false}}'
        }
        
        # Upload to Dropbox
        response = requests.post(
            self.upload_url,
            headers=headers,
            data=file_content,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                'success': True,
                'path': result.get('path_display'),
                'name': result.get('name'),
                'size': result.get('size'),
                'id': result.get('id')
            }
        else:
            error_msg = response.text
            try:
                error_data = response.json()
                error_msg = error_data.get('error_summary', error_msg)
            except:
                pass
            
            raise Exception(f"Dropbox upload failed: {error_msg}")
    
    def create_shared_link(self, dropbox_path: str) -> Optional[str]:
        """
        Create a shared link for a Dropbox file
        
        Args:
            dropbox_path: Path to file in Dropbox
            
        Returns:
            Shared link URL or None
        """
        if not self.access_token:
            return None
        
        url = "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "path": dropbox_path,
            "settings": {
                "requested_visibility": "public"
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return result.get('url')
            elif response.status_code == 409:
                # Link already exists, get existing link
                return self._get_existing_shared_link(dropbox_path)
            else:
                print(f"Failed to create shared link: {response.text}")
                return None
        except Exception as e:
            print(f"Error creating shared link: {str(e)}")
            return None
    
    def _get_existing_shared_link(self, dropbox_path: str) -> Optional[str]:
        """Get existing shared link for a file"""
        url = "https://api.dropboxapi.com/2/sharing/list_shared_links"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {"path": dropbox_path}
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                links = result.get('links', [])
                if links:
                    return links[0].get('url')
            return None
        except:
            return None
    
    def upload_campaign_images(
        self,
        campaign_id: str,
        image_paths: Dict[str, str],
        storage_base_path: Path
    ) -> Dict[str, Dict]:
        """
        Upload all campaign image variations to Dropbox
        
        Args:
            campaign_id: Campaign ID
            image_paths: Dictionary of image paths (ratio_1_1, ratio_9_16, ratio_16_9)
            storage_base_path: Base storage path for resolving relative paths
            
        Returns:
            Dictionary mapping ratio names to upload results
        """
        if not self.access_token:
            raise ValueError("Dropbox upload not configured. Set DROPBOX_ACCESS_TOKEN in environment.")
        
        results = {}
        
        # Create campaign folder path
        campaign_folder = f"{self.folder_path}/{campaign_id}"
        
        for ratio_name, relative_path in image_paths.items():
            try:
                # Resolve full path
                full_path = storage_base_path / relative_path
                
                # Get filename from path
                filename = full_path.name
                
                # Dropbox destination path
                dropbox_path = f"{campaign_folder}/{ratio_name.replace('ratio_', '')}_{filename}"
                
                # Upload file
                upload_result = self.upload_file(full_path, dropbox_path)
                
                # Create shared link
                shared_link = self.create_shared_link(upload_result['path'])
                
                results[ratio_name] = {
                    'success': True,
                    'dropbox_path': upload_result['path'],
                    'shared_link': shared_link,
                    'size': upload_result['size']
                }
                
                print(f"✅ Uploaded {ratio_name} to Dropbox: {upload_result['path']}")
                
            except Exception as e:
                results[ratio_name] = {
                    'success': False,
                    'error': str(e)
                }
                print(f"❌ Failed to upload {ratio_name}: {str(e)}")
        
        return results
    
    def get_thumbnail_link(self, dropbox_path: str, size: str = "w640h480") -> Optional[str]:
        """
        Get a thumbnail link for a Dropbox file
        
        Args:
            dropbox_path: Path to file in Dropbox
            size: Thumbnail size (w32h32, w64h64, w128h128, w256h256, w480h320, w640h480, w960h640, w1024h768, w2048h1536)
            
        Returns:
            Thumbnail link URL or None
        """
        if not self.access_token:
            return None
        
        url = "https://content.dropboxapi.com/2/files/get_thumbnail_v2"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Dropbox-API-Arg': f'{{"resource": {{".tag": "path", "path": "{dropbox_path}"}}, "format": "jpeg", "size": "{size}"}}'
        }
        
        try:
            response = requests.post(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # The thumbnail is returned as binary data
                # For web display, we would need to encode it or store it
                # For now, return a direct download link instead
                return self.create_shared_link(dropbox_path)
            else:
                print(f"Failed to get thumbnail: {response.text}")
                return None
        except Exception as e:
            print(f"Error getting thumbnail: {str(e)}")
            return None
    
    def get_preview_link(self, dropbox_path: str) -> Optional[str]:
        """
        Get a preview link for a Dropbox file
        
        Args:
            dropbox_path: Path to file in Dropbox
            
        Returns:
            Preview link URL or None
        """
        if not self.access_token:
            return None
        
        url = "https://api.dropboxapi.com/2/files/get_preview"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Dropbox-API-Arg': f'{{"path": "{dropbox_path}"}}'
        }
        
        try:
            response = requests.post(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Return the shared link for preview
                return self.create_shared_link(dropbox_path)
            else:
                print(f"Failed to get preview: {response.text}")
                return None
        except Exception as e:
            print(f"Error getting preview: {str(e)}")
            return None
    
    def convert_shared_link_to_direct(self, shared_link: str) -> str:
        """
        Convert a Dropbox shared link to a direct download/preview link
        
        Args:
            shared_link: Dropbox shared link
            
        Returns:
            Direct link URL
        """
        if not shared_link:
            return shared_link
        
        # Convert www.dropbox.com to dl.dropboxusercontent.com and remove ?dl=0
        return shared_link.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '')
    
    def is_configured(self) -> bool:
        """Check if Dropbox upload is properly configured"""
        return bool(self.access_token)


# Singleton instance
_dropbox_service = None


def get_dropbox_service() -> DropboxUploadService:
    """Get Dropbox upload service singleton instance"""
    global _dropbox_service
    if _dropbox_service is None:
        _dropbox_service = DropboxUploadService()
    return _dropbox_service

