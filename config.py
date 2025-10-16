from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_secret_key: str = "dev-secret-key-change-in-production"
    
    # Basic Auth
    basic_auth_username: str = "admin"
    basic_auth_password: str = "changeme"
    
    # Redis Configuration
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_url: str = "redis://localhost:6379/0"
    
    # MySQL Database Configuration
    database_url: Optional[str] = None
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "campaign_user"
    mysql_password: str = "your_password"
    mysql_database: str = "campaigns_db"
    
    # Adobe Firefly API
    adobe_client_id: str = ""
    adobe_client_secret: str = ""
    adobe_api_key: str = ""
    
    # Dropbox API (for uploading processed images)
    dropbox_access_token: str = ""
    dropbox_folder_path: str = "/campaign-images"  # Base folder in Dropbox
    
    # Storage Configuration
    storage_path: str = "./storage"
    upload_path: str = "./storage/uploads"
    generated_path: str = "./storage/generated"
    
    # Content Validation
    prohibited_words_str: str = "spam,scam,fake,fraud,illegal,drugs,weapons,violence,hate,explicit,adult,casino,gambling,phishing"
    enable_content_validation: bool = True
    
    # Brand Validation
    brand_colors_str: str = "#FF5733,#3498DB,#2ECC71,#F39C12,#9B59B6"  # Default brand colors (hex)
    enable_brand_validation: bool = True
    brand_color_tolerance: int = 30  # Color matching tolerance (0-255)
    brand_compliance_threshold: float = 50.0  # Minimum percentage of brand colors required
    
    @property
    def prohibited_words(self) -> List[str]:
        """Parse prohibited words from comma-separated string"""
        return [word.strip() for word in self.prohibited_words_str.split(",") if word.strip()]
    
    @property
    def brand_colors(self) -> List[str]:
        """Parse brand colors from comma-separated string"""
        return [color.strip() for color in self.brand_colors_str.split(",") if color.strip()]
    
    def get_database_url(self) -> str:
        """Get database URL, building from components if not provided"""
        if self.database_url:
            return self.database_url
        
        # Build MySQL connection string from components
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            f"?charset=utf8mb4"
        )
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

