import httpx
import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class SallaClient:
    """Client for interacting with Salla API"""
    
    def __init__(self, access_token: str):
        self.base_url = "https://api.salla.dev/admin/v2"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    async def get_store_info(self) -> Dict[str, Any]:
        """Get store information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/store",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()["data"]
    
    async def register_workflow_webhooks(self, store_id: str) -> None:
        """Register webhooks for the 10 workflows"""
        webhook_events = [
            # Customer workflows
            "order.cart.created",
            "order.cart.updated",
            "customer.created",
            "customer.updated",
            
            # Order workflows
            "order.created",
            "order.updated",
            "order.shipment.created",
            "order.shipment.updated",
            "order.return.created",
            
            # Product workflows
            "product.created",
            "product.updated",
            "product.stock.updated",
            
            # Review workflows
            "review.created",
            "review.updated",
        ]
        
        webhook_url = f"{settings.WEBHOOK_BASE_URL}/api/v1/webhooks/salla"
        
        async with httpx.AsyncClient() as client:
            for event in webhook_events:
                try:
                    response = await client.post(
                        f"{self.base_url}/webhooks",
                        headers=self.headers,
                        json={
                            "url": webhook_url,
                            "events": [event]
                        }
                    )
                    if response.status_code == 201:
                        logger.info(f"Registered webhook for {event}")
                    else:
                        logger.warning(f"Failed to register {event}: {response.text}")
                except Exception as e:
                    logger.error(f"Error registering webhook {event}: {e}")

