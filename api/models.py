from sqlalchemy import Column, String, Text, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import enum
import uuid


Base = declarative_base()


class CampaignStatus(str, enum.Enum):
    """Campaign processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ACTIVE = "active"


class Campaign(Base):
    """Campaign database model"""
    __tablename__ = "campaigns"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Campaign details
    description = Column(Text, nullable=False)
    target_market = Column(String(500), nullable=False)
    campaign_message = Column(Text, nullable=False)
    products_description = Column(Text, nullable=False)
    marketing_channel = Column(String(100), nullable=True)  # e.g., 'social_media', 'email', 'display_ads', etc.
    
    # Products list (stored as JSON array of {sku, price} objects)
    products = Column(JSON, nullable=False)
    
    # Flexible metadata field for additional campaign information
    item_metadata = Column(JSON, nullable=True)
    
    # Image metadata
    image_metadata = Column(JSON, nullable=False)  # Stores image source info
    generate_by_ai = Column(SQLEnum('true', 'false', name='boolean'), nullable=False)
    
    # Processed images (stored as JSON with paths to variations)
    processed_images = Column(JSON, nullable=True)
    
    # Dropbox backup status and links
    auto_upload_to_dropbox = Column(SQLEnum('true', 'false', name='boolean_auto_dropbox'), nullable=True, default='false')
    dropbox_uploaded = Column(SQLEnum('true', 'false', name='boolean_dropbox'), nullable=True, default='false')
    dropbox_links = Column(JSON, nullable=True)  # Stores Dropbox paths and shared links
    
    # Status tracking
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Content validation
    content_validation_status = Column(String(20), nullable=True)  # 'passed', 'skipped', 'not_validated'
    content_validation_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "description": self.description,
            "target_market": self.target_market,
            "campaign_message": self.campaign_message,
            "products_description": self.products_description,
            "marketing_channel": self.marketing_channel,
            "products": self.products,
            "item_metadata": self.item_metadata,
            "image_metadata": self.image_metadata,
            "generate_by_ai": self.generate_by_ai,
            "processed_images": self.processed_images,
            "auto_upload_to_dropbox": self.auto_upload_to_dropbox,
            "dropbox_uploaded": self.dropbox_uploaded,
            "dropbox_links": self.dropbox_links,
            "status": self.status.value if isinstance(self.status, CampaignStatus) else self.status,
            "error_message": self.error_message,
            "content_validation_status": self.content_validation_status,
            "content_validation_message": self.content_validation_message,
            "brand_validation_status": self.brand_validation_status,
            "brand_validation_message": self.brand_validation_message,
            "brand_validation_result": self.brand_validation_result,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
