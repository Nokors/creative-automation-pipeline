import requests
import base64
import time
from pathlib import Path
from typing import Optional
from config import get_settings
import uuid

settings = get_settings()


class AdobeFireflyService:
    """Service for generating images using Adobe Firefly API"""
    
    FIREFLY_API_BASE = "https://firefly-api.adobe.io"
    TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3"
    
    def __init__(self):
        self.client_id = settings.adobe_client_id
        self.client_secret = settings.adobe_client_secret
        self.api_key = settings.adobe_api_key
        self.access_token = None
        self.token_expiry = 0
        self.generated_path = Path(settings.generated_path)
    
    def get_access_token(self) -> str:
        """
        Get OAuth access token for Adobe Firefly API
        
        Returns:
            Access token string
        """
        # Check if we have a valid token
        if self.access_token and time.time() < self.token_expiry:
            return self.access_token
        
        # Request new token
        try:
            headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "openid,AdobeID,firefly_api"
            }
            
            response = requests.post(
                self.TOKEN_URL,
                headers=headers,
                data=data,
                timeout=30
            )
            response.raise_for_status()
            print(response.json())
            token_data = response.json()
            self.access_token = token_data['access_token']
            # Set expiry to 5 minutes before actual expiry
            self.token_expiry = time.time() + token_data.get('expires_in', 3600) - 300
            
            return self.access_token
            
        except Exception as e:
            raise Exception(f"Failed to get Adobe Firefly access token: {str(e)}")
    
    def generate_image(
        self,
        prompt: str,
        campaign_id: str,
        width: int = 2048,
        height: int = 2048,
        num_variations: int = 1,
        product_skus: list = None
    ) -> Optional[Path]:
        """
        Generate image using Adobe Firefly API
        
        Args:
            prompt: Text prompt for image generation
            campaign_id: Campaign ID for file organization
            width: Image width in pixels
            height: Image height in pixels
            num_variations: Number of image variations to generate
            product_skus: List of product SKUs to include in folder name
            
        Returns:
            Path to generated image file
        """
        # Check if credentials are configured
        if not self.client_id or not self.api_key:
            raise Exception(
                "Adobe Firefly API credentials not configured. "
                "Please set ADOBE_CLIENT_ID, ADOBE_CLIENT_SECRET, and ADOBE_API_KEY in .env file"
            )
        
        try:
            # Get access token
            access_token = self.get_access_token()
            
            # Prepare API request
            headers = {
                "Authorization": f"Bearer {access_token}",
                "x-api-key": self.api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": prompt,
                "n": num_variations,
                "size": {
                    "width": width,
                    "height": height
                },
                "contentClass": "photo",  # or "art" depending on use case
                "styles": {
                    "presets": ["photo", "professional"]
                }
            }
            
            # Make API request
            response = requests.post(
                f"{self.FIREFLY_API_BASE}/v2/images/generate",
                headers=headers,
                json=payload,
                timeout=120  # Longer timeout for image generation
            )
            
            response.raise_for_status()
            result = response.json()
            # Extract image data
            if 'outputs' in result and len(result['outputs']) > 0:
                image_data = result['outputs'][0]['image']
                print("Image data:")
                print(image_data)
                if 'presignedUrl' in image_data:
                    # Image URL - download it
                    img_response = requests.get(image_data['presignedUrl'], timeout=30)
                    img_response.raise_for_status()
                    image_bytes = img_response.content
                else:
                    raise Exception("No image data found in API response")
                
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
                
                # Save image with SKU in filename if present
                if sku_subfolder:
                    filename = f"{campaign_id}_{sku_subfolder}_ai_generated_{uuid.uuid4().hex[:8]}.jpg"
                else:
                    filename = f"{campaign_id}_ai_generated_{uuid.uuid4().hex[:8]}.jpg"
                output_path = base_dir / filename
                
                with open(output_path, 'wb') as f:
                    f.write(image_bytes)
                
                return output_path
            else:
                raise Exception("No image generated by Adobe Firefly API")
                
        except requests.exceptions.HTTPError as e:
            error_detail = ""
            try:
                error_detail = e.response.json()
            except:
                error_detail = e.response.text
            raise Exception(f"Adobe Firefly API error: {str(e)} - {error_detail}")
        except Exception as e:
            raise Exception(f"Failed to generate image with Adobe Firefly: {str(e)}")
    
    def generate_with_fallback(
        self,
        prompt: str,
        campaign_id: str,
        product_skus: list = None
    ) -> Optional[Path]:
        """
        Generate image with fallback to placeholder
        
        This method attempts to generate an image with Adobe Firefly.
        If it fails (e.g., credentials not configured), it creates a
        placeholder image instead.
        
        Args:
            prompt: Text prompt for image generation
            campaign_id: Campaign ID
            product_skus: List of product SKUs to include in folder name
            
        Returns:
            Path to generated or placeholder image
        """
        try:
            return self.generate_image(prompt, campaign_id, product_skus=product_skus)
        except Exception as e:
            print(f"⚠️  Adobe Firefly generation failed: {str(e)}")
            print("📦 Creating placeholder image instead...")
            
            # Create a simple placeholder
            return self._create_placeholder(campaign_id, prompt, product_skus)
    
    def _create_placeholder(self, campaign_id: str, prompt: str, product_skus: list = None) -> Path:
        """
        Create a placeholder image when AI generation is not available
        
        Args:
            campaign_id: Campaign ID
            prompt: Original prompt (for reference)
            product_skus: List of product SKUs to include in folder name
            
        Returns:
            Path to placeholder image
        """
        from PIL import Image, ImageDraw, ImageFont
        
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
        
        # Create a simple colored placeholder
        img = Image.new('RGB', (2048, 2048), color=(100, 150, 200))
        draw = ImageDraw.Draw(img)
        
        # Add text
        try:
            # Try to use a nice font
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
        except:
            font = ImageFont.load_default()
        
        text = "AI Generated Placeholder\n(Configure Adobe Firefly API)"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = ((2048 - text_width) // 2, (2048 - text_height) // 2)
        draw.text(position, text, fill=(255, 255, 255), font=font, align="center")
        
        # Save placeholder with SKU in filename if present
        if sku_subfolder:
            filename = f"{campaign_id}_{sku_subfolder}_placeholder_{uuid.uuid4().hex[:8]}.jpg"
        else:
            filename = f"{campaign_id}_placeholder_{uuid.uuid4().hex[:8]}.jpg"
        output_path = base_dir / filename
        img.save(output_path, 'JPEG', quality=95)
        
        return output_path

