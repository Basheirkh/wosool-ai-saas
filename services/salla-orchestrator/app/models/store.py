from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Store(BaseModel):
    """Store model for Salla store data"""
    id: str
    store_id: str
    domain: str
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    tenant_id: str
    twenty_api_key: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

