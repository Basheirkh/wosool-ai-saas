/**
 * Salla Webhook Controller
 * 
 * Handles incoming webhooks from Salla:
 * - App installation
 * - App uninstallation
 * - Data updates (customers, products, orders)
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import SallaIntegrationService from '../../services/salla-integration.js';
import ProvisioningQueueService from '../../services/provisioning-queue.js';
import crypto from 'crypto';

const router = Router();

export function createSallaWebhookRouter(globalDb: Pool, provisioningQueue: ProvisioningQueueService): Router {
  const sallaService = new SallaIntegrationService(globalDb, provisioningQueue);

  /**
   * POST /api/salla/webhook
   * Main Salla webhook endpoint
   */
  router.post('/', async (req: Request, res: Response) => {
    const event = req.headers['x-salla-event'] as string;
    const signature = req.headers['x-salla-signature'] as string;
    const payload = req.body;

    console.log(`📩 Received Salla webhook: ${event}`);

    // 1. Verify signature (if secret is configured)
    const webhookSecret = process.env.SALLA_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = hmac.update(JSON.stringify(payload)).digest('hex');
      
      if (signature !== digest) {
        console.warn('⚠️ Invalid Salla webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    try {
      switch (event) {
        case 'app.installed':
          // Handle new installation
          await sallaService.handleInstallation({
            store_id: payload.data.store_id,
            access_token: payload.data.access_token,
            refresh_token: payload.data.refresh_token,
            expires_in: payload.data.expires_in,
            store_info: payload.data.store_info
          });
          break;

        case 'app.uninstalled':
          // Handle uninstallation (suspend tenant)
          await globalDb.query(
            "UPDATE tenant_registry SET status = 'suspended', updated_at = NOW() WHERE salla_store_id = $1",
            [payload.data.store_id]
          );
          console.log(`🚫 Suspended tenant for Salla store: ${payload.data.store_id}`);
          break;

        case 'customer.created':
        case 'customer.updated':
          // Handle customer updates
          // TODO: Trigger async sync for this customer
          break;

        case 'order.created':
        case 'order.updated':
          // Handle order updates
          // TODO: Trigger async sync for this order
          break;

        default:
          console.log(`ℹ️ Unhandled Salla event: ${event}`);
      }

      return res.json({ status: 'success' });
    } catch (error: any) {
      console.error(`❌ Error processing Salla webhook: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/salla/webhook
   * Salla webhook verification endpoint
   */
  router.get('/', (req: Request, res: Response) => {
    const challenge = req.query.challenge;
    if (challenge) {
      return res.json({ challenge });
    }
    return res.json({ status: 'ready' });
  });

  return router;
}

export default createSallaWebhookRouter;
