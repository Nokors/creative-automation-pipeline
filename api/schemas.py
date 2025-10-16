from pydantic import BaseModel, Field, field_validator, HttpUrl, model_validator
from typing import Optional, List, Union, Dict, Any
from enum import Enum
from datetime import datetime
from decimal import Decimal


# ISO 639-1 language codes (common languages)
SUPPORTED_LANGUAGES = {
    'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ko',
    'ar', 'hi', 'tr', 'sv', 'da', 'fi', 'no', 'cs', 'el', 'he', 'th', 'vi',
    'id', 'ms', 'ro', 'hu', 'uk', 'bg', 'hr', 'sk', 'sl', 'lt', 'lv', 'et',
    'ca', 'eu', 'gl', 'af', 'sq', 'am', 'hy', 'az', 'be', 'bn', 'bs', 'my',
    'km', 'ka', 'gu', 'ha', 'is', 'ig', 'jv', 'kn', 'kk', 'ky', 'lo', 'mk',
    'mg', 'ml', 'mr', 'mn', 'ne', 'or', 'pa', 'ps', 'fa', 'sd', 'si', 'so',
    'sw', 'tg', 'ta', 'te', 'tk', 'tl', 'ur', 'uz', 'cy', 'xh', 'yi', 'yo',
    'zu'
}


class ProductItem(BaseModel):
    """Product item schema"""
    sku: str = Field(..., min_length=1, max_length=100, description="Product SKU/Code")
    price: float = Field(..., gt=0, description="Product price (must be greater than 0)")
    
    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v):
        """Validate SKU format"""
        v = v.strip()
        if not v:
            raise ValueError("SKU cannot be empty or whitespace")
        return v
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        """Validate price is positive"""
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        # Round to 2 decimal places
        return round(v, 2)
    
    class Config:
        json_schema_extra = {
            "example": {
                "sku": "PROD-001",
                "price": 29.99
            }
        }


class ImageSourceType(str, Enum):
    """Type of image source"""
    LOCAL = "local"
    AI_GENERATED = "ai_generated"


class ImageMetadata(BaseModel):
    """Image metadata schema"""
    source_type: ImageSourceType = Field(..., description="Type of image source")
    source_path: Optional[str] = Field(None, description="Path for local images")
    ai_prompt: Optional[str] = Field(None, description="Prompt for AI generation")
    
    @field_validator('source_path')
    @classmethod
    def validate_source_path(cls, v, info):
        """Validate source path is provided when needed"""
        source_type = info.data.get('source_type')
        if source_type == ImageSourceType.LOCAL and not v:
            raise ValueError(f"source_path is required for {source_type} images")
        return v
    
    @field_validator('ai_prompt')
    @classmethod
    def validate_ai_prompt(cls, v, info):
        """Validate AI prompt is provided when needed"""
        source_type = info.data.get('source_type')
        if source_type == ImageSourceType.AI_GENERATED and not v:
            raise ValueError("ai_prompt is required for AI generated images")
        return v


class MarketingChannel(str, Enum):
    """Marketing channel types"""
    SOCIAL_MEDIA = "social_media"
    EMAIL = "email"
    DISPLAY_ADS = "display_ads"
    SEARCH_ADS = "search_ads"
    CONTENT_MARKETING = "content_marketing"
    VIDEO_MARKETING = "video_marketing"
    INFLUENCER = "influencer"
    PRINT = "print"
    OUTDOOR = "outdoor"
    DIRECT_MAIL = "direct_mail"
    EVENTS = "events"
    OTHER = "other"


class CampaignCreate(BaseModel):
    """Schema for creating a campaign"""
    description: str = Field(..., min_length=1, max_length=5000, description="Campaign description")
    target_market: str = Field(..., min_length=1, max_length=500, description="Target market description")
    campaign_message: str = Field(..., min_length=1, max_length=5000, description="Campaign message")
    products_description: str = Field(..., min_length=1, max_length=5000, description="Products description")
    marketing_channel: Optional[MarketingChannel] = Field(None, description="Marketing channel type for this campaign")
    products: List[ProductItem] = Field(..., min_length=1, description="List of products in the campaign")
    item_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata for the campaign (flexible JSON object)")
    image_metadata: ImageMetadata = Field(..., description="Image metadata and source")
    generate_by_ai: bool = Field(False, description="Flag to generate image by AI")
    auto_upload_to_dropbox: bool = Field(False, description="Automatically upload processed images to Dropbox after campaign completion")
    
    @field_validator('products')
    @classmethod
    def validate_products(cls, v):
        """Validate products list"""
        if not v or len(v) == 0:
            raise ValueError("At least one product is required")
        
        # Check for duplicate SKUs
        skus = [p.sku for p in v]
        if len(skus) != len(set(skus)):
            raise ValueError("Duplicate SKUs found in products list")
        
        return v
    
    @field_validator('generate_by_ai')
    @classmethod
    def validate_generate_by_ai(cls, v, info):
        """Ensure generate_by_ai matches image source type"""
        image_metadata = info.data.get('image_metadata')
        if image_metadata and v and image_metadata.source_type != ImageSourceType.AI_GENERATED:
            raise ValueError("When generate_by_ai is True, source_type must be 'ai_generated'")
        return v
    
    @model_validator(mode='after')
    def validate_prohibited_words(self):
        """Validate all text fields for prohibited words"""
        from config import get_settings
        from services.content_validator import get_content_validator
        
        settings = get_settings()
        
        # Skip if validation is disabled
        if not settings.enable_content_validation:
            return self
        
        # Validate content
        validator = get_content_validator()
        result = validator.validate_campaign_content(
            description=self.description,
            campaign_message=self.campaign_message,
            products_description=self.products_description,
            target_market=self.target_market
        )
        
        if not result["is_valid"]:
            raise ValueError(result["message"])
        
        return self
    
    @model_validator(mode='after')
    def validate_metadata_languages(self):
        """Validate language codes in item_metadata if present"""
        if self.item_metadata and 'languages' in self.item_metadata:
            languages = self.item_metadata['languages']
            
            # Ensure languages is a list
            if not isinstance(languages, list):
                raise ValueError("item_metadata.languages must be a list of language codes")
            
            # Must have at least one language
            if len(languages) == 0:
                raise ValueError("item_metadata.languages must contain at least one language code")
            
            # Validate each language code
            invalid_codes = []
            for lang in languages:
                if not isinstance(lang, str):
                    raise ValueError(f"Language code must be a string, got: {type(lang).__name__}")
                
                lang_lower = lang.lower().strip()
                if lang_lower not in SUPPORTED_LANGUAGES:
                    invalid_codes.append(lang)
            
            if invalid_codes:
                raise ValueError(
                    f"Invalid language code(s): {', '.join(invalid_codes)}. "
                    f"Must be valid ISO 639-1 codes (e.g., 'en', 'es', 'fr', 'de')"
                )
            
            # Normalize language codes to lowercase
            self.item_metadata['languages'] = [lang.lower().strip() for lang in languages]
            
            # Check for duplicates
            if len(self.item_metadata['languages']) != len(set(self.item_metadata['languages'])):
                raise ValueError("item_metadata.languages contains duplicate language codes")
        
        return self
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Summer 2025 Marketing Campaign for Beach Products",
                "target_market": "Young adults aged 18-35 interested in outdoor activities",
                "campaign_message": "Make this summer unforgettable with our exclusive beach collection!",
                "products_description": "Premium beach towels, sunscreen, and beach accessories",
                "products": [
                    {"sku": "BEACH-TOWEL-001", "price": 29.99},
                    {"sku": "SUNSCREEN-SPF50", "price": 15.99},
                    {"sku": "BEACH-BAG-BLUE", "price": 39.99}
                ],
                    "item_metadata": {
                        "languages": ["en", "es", "fr"],
                        "campaign_type": "seasonal",
                        "budget": 50000,
                        "start_date": "2025-06-01",
                        "end_date": "2025-08-31",
                        "tags": ["summer", "beach", "outdoor"]
                    },
                "image_metadata": {
                    "source_type": "ai_generated",
                    "ai_prompt": "A beautiful beach scene with colorful towels and happy people"
                },
                "generate_by_ai": True
            }
        }


class ProcessedImage(BaseModel):
    """Schema for processed image variations"""
    ratio_1_1: str = Field(..., description="Path to 1:1 aspect ratio image")
    ratio_9_16: str = Field(..., description="Path to 9:16 aspect ratio image")
    ratio_16_9: str = Field(..., description="Path to 16:9 aspect ratio image")


class CampaignResponse(BaseModel):
    """Schema for campaign response"""
    id: str
    description: str
    target_market: str
    campaign_message: str
    products_description: str
    marketing_channel: Optional[str]
    products: Optional[List[Dict]]
    item_metadata: Optional[Dict]
    image_metadata: dict
    generate_by_ai: str
    processed_images: Optional[dict]
    auto_upload_to_dropbox: Optional[str]
    dropbox_uploaded: Optional[str]
    dropbox_links: Optional[dict]
    status: str
    error_message: Optional[str]
    content_validation_status: Optional[str]
    content_validation_message: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]
    completed_at: Optional[str]
    
    class Config:
        from_attributes = True


class CampaignCreateResponse(BaseModel):
    """Response after initiating campaign creation"""
    id: str
    status: str
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "pending",
                "message": "Campaign creation initiated. Processing asynchronously."
            }
        }


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_type: Optional[str] = None


class ContentValidationError(BaseModel):
    """Content validation error response"""
    error: str
    message: str
    violations: Dict[str, List[str]]
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Content validation failed",
                "message": "Prohibited words found in description: spam, scam; campaign_message: fake",
                "violations": {
                    "description": ["spam", "scam"],
                    "campaign_message": ["fake"]
                }
            }
        }


class AssetReportResponse(BaseModel):
    """Asset reporting response schema"""
    total_campaigns: int = Field(..., description="Total number of campaigns")
    ai_generated: int = Field(..., description="Number of AI-generated images")
    local_uploads: int = Field(..., description="Number of local file uploads")
    by_status: Dict[str, Dict[str, int]] = Field(..., description="Breakdown by campaign status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_campaigns": 150,
                "ai_generated": 85,
                "local_uploads": 65,
                "by_status": {
                    "completed": {
                        "ai_generated": 70,
                        "local_uploads": 55
                    },
                    "pending": {
                        "ai_generated": 10,
                        "local_uploads": 5
                    },
                    "processing": {
                        "ai_generated": 3,
                        "local_uploads": 3
                    },
                    "failed": {
                        "ai_generated": 2,
                        "local_uploads": 2
                    }
                }
            }
        }


class ImageInfo(BaseModel):
    """Image information schema"""
    filename: str
    file_size: int
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: float
    url: str
    thumbnail_url: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "beach-sunset_a1b2c3d4.jpg",
                "file_size": 2458624,
                "mime_type": "image/jpeg",
                "width": 1920,
                "height": 1080,
                "uploaded_at": 1705312200.0,
                "url": "/api/images/beach-sunset_a1b2c3d4.jpg",
                "thumbnail_url": "/api/images/beach-sunset_a1b2c3d4.jpg/thumbnail"
            }
        }


class ImageListResponse(BaseModel):
    """Response schema for image list"""
    total: int
    images: List[ImageInfo]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 3,
                "images": [
                    {
                        "filename": "product_a1b2c3d4.jpg",
                        "file_size": 1458624,
                        "mime_type": "image/jpeg",
                        "width": 1200,
                        "height": 800,
                        "uploaded_at": 1705312200.0,
                        "url": "/api/images/product_a1b2c3d4.jpg",
                        "thumbnail_url": "/api/images/product_a1b2c3d4.jpg/thumbnail"
                    }
                ]
            }
        }
