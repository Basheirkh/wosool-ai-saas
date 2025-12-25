from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import httpx
import logging
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.security import generate_oauth_state
from app.services.salla_client import SallaClient
from app.models.store import Store

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/install")
async def install_app(request: Request):
    """Redirect to Salla for app installation with workflow-specific scopes"""
    state = generate_oauth_state()
    
    # Store state in Redis (if available)
    if hasattr(request.app.state, 'redis'):
        await request.app.state.redis.setex(
            f"oauth_state:{state}", 
            600,  # 10 minute expiry
            "pending"
        )
    else:
        # Fallback: store in memory (not recommended for production)
        if not hasattr(request.app.state, 'oauth_states'):
            request.app.state.oauth_states = {}
        request.app.state.oauth_states[state] = {
            "status": "pending",
            "created_at": datetime.utcnow()
        }
    
    # MINIMAL scopes for our 10 workflows
    scopes = [
        # Core
        "offline_access",  # Required for long-term access
        
        # Customer workflows (abandoned cart, VIP, win-back)
        "read_customers", "write_customers",  # For customer segmentation & updates
        "read_carts",  # For abandoned cart detection
        
        # Order workflows (shipping delay, fraud, auto-return)
        "read_orders", "write_orders",  # Core order processing
        "read_shipments",  # For shipping delay detection
        "read_order_returns",  # For automated returns
        
        # Product workflows (back-in-stock, low stock urgency)
        "read_products", "write_products",  # For inventory management
        
        # Sentiment rescue workflow
        "read_reviews",  # For customer sentiment analysis
        
        # Knowledge transfer workflow
        "read_settings",  # For store configuration data
    ]
    
    auth_url = (
        f"https://salla.com/oauth2/authorize?"
        f"client_id={settings.SALLA_CLIENT_ID}&"
        f"redirect_uri={settings.SALLA_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={' '.join(scopes)}&"
        f"state={state}"
    )
    
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(request: Request, code: str, state: str, store_domain: str):
    """Handle OAuth callback from Salla"""
    # Verify state
    state_valid = False
    if hasattr(request.app.state, 'redis'):
        stored_state = await request.app.state.redis.get(f"oauth_state:{state}")
        state_valid = stored_state is not None
    elif hasattr(request.app.state, 'oauth_states'):
        state_valid = state in request.app.state.oauth_states
    
    if not state_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired state")
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://api.salla.dev/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.SALLA_CLIENT_ID,
                "client_secret": settings.SALLA_CLIENT_SECRET,
                "redirect_uri": settings.SALLA_REDIRECT_URI,
                "code": code
            }
        )
        
        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        tokens = token_response.json()
    
    # Get store info
    salla_client = SallaClient(tokens["access_token"])
    store_info = await salla_client.get_store_info()
    
    # Store credentials in database
    store = Store(
        id=str(store_info["id"]),
        store_id=str(store_info["id"]),
        domain=store_domain,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        token_expires_at=datetime.utcnow() + timedelta(seconds=tokens["expires_in"]),
        tenant_id=str(store_info["id"]),  # Use store ID as tenant ID
        twenty_api_key=f"sk_{generate_oauth_state()}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # TODO: Save to DB (implement your DB logic here)
    # await store.save()
    logger.info(f"Store {store.store_id} installed successfully")
    
    # TODO: Trigger initial sync
    # await trigger_full_sync(store)
    
    # Register webhooks for our 10 workflows
    await salla_client.register_workflow_webhooks(store_info["id"])
    
    return {
        "status": "success",
        "store_id": store_info["id"],
        "store_domain": store_domain,
        "tenant_id": store.tenant_id,
        "message": "App installed successfully. Workflow sync started."
    }

