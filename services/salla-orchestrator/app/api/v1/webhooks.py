from fastapi import APIRouter, Request, HTTPException, Header
import logging
import hmac
import hashlib
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/salla")
async def salla_webhook(
    request: Request,
    x_salla_signature: str = Header(None),
    x_salla_event: str = Header(None)
):
    """
    Handle webhooks from Salla for the 10 workflows
    
    Supported events:
    - Customer: customer.created, customer.updated
    - Cart: order.cart.created, order.cart.updated
    - Order: order.created, order.updated
    - Shipment: order.shipment.created, order.shipment.updated
    - Return: order.return.created
    - Product: product.created, product.updated, product.stock.updated
    - Review: review.created, review.updated
    """
    try:
        # Get request body
        body = await request.body()
        payload = await request.json()
        
        # Verify webhook signature
        if settings.SALLA_WEBHOOK_SECRET and x_salla_signature:
            expected_signature = hmac.new(
                settings.SALLA_WEBHOOK_SECRET.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(x_salla_signature, expected_signature):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Log webhook event
        logger.info(f"Received webhook: {x_salla_event} - {payload.get('event', 'unknown')}")
        
        # Route to appropriate handler based on event type
        event_type = x_salla_event or payload.get('event', '')
        
        # TODO: Implement workflow handlers
        # This will trigger the appropriate workflow based on event type:
        # - Abandoned Cart Recovery (order.cart.created/updated)
        # - VIP Discovery (customer.created/updated, order.created)
        # - Shipping Delay Mitigator (order.shipment.created/updated)
        # - Fraud Mitigation (order.created)
        # - Auto Return (order.return.created)
        # - Back-in-Stock (product.stock.updated)
        # - Low Stock Urgency (product.stock.updated)
        # - Sentiment Rescue (review.created/updated)
        # - Win-Back Campaign (customer.updated, order.created)
        # - Knowledge Transfer (settings updates)
        
        # For now, just acknowledge receipt
        return {
            "status": "received",
            "event": event_type,
            "message": "Webhook received and queued for processing"
        }
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")


@router.get("/salla")
async def webhook_verification(request: Request):
    """Webhook verification endpoint for Salla"""
    challenge = request.query_params.get("challenge")
    if challenge:
        return {"challenge": challenge}
    return {"status": "ready", "endpoint": "/api/v1/webhooks/salla"}

