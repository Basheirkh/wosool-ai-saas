from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Salla API Configuration
    SALLA_CLIENT_ID: str
    SALLA_CLIENT_SECRET: str
    SALLA_REDIRECT_URI: Optional[str] = "https://api.wosool.ai/salla/callback"
    
    # Database
    POSTGRES_URL: Optional[str] = None
    POSTGRES_USER: Optional[str] = "bridge"
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = "bridge"
    
    # Redis
    REDIS_URL: Optional[str] = None
    REDIS_PASSWORD: Optional[str] = None
    
    # Twenty CRM
    TWENTY_API_URL: Optional[str] = None
    TWENTY_API_KEY: Optional[str] = None
    
    # Webhook
    WEBHOOK_BASE_URL: Optional[str] = None
    SALLA_WEBHOOK_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

