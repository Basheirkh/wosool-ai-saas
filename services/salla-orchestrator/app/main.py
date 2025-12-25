from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.api.v1 import auth, webhooks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Salla-Twenty Bridge",
    description="Multi-store orchestration with auto-sync",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])

@app.get("/")
async def root():
    return {
        "message": "Salla-Twenty Bridge v2",
        "features": [
            "Multi-tenant OAuth",
            "Auto-full-sync on install",
            "Real-time webhooks",
            "10 workflow automations"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "components": ["bridge", "sync", "webhooks"]}
