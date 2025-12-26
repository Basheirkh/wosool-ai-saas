/**
 * Clerk Webhook Handler
 * 
 * Handles Clerk webhooks to automatically provision tenants and sync users
 */

import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { Pool } from 'pg';
import ProvisioningQueueService from '../../services/provisioning-queue.js';
import ImprovedTenantProvisioningService from '../../services/tenant-provisioning.js';

export function createClerkWebhookRouter(
  globalDb: Pool,
  provisioningQueue: ProvisioningQueueService,
  tenantProvisioning: ImprovedTenantProvisioningService
): Router {
  const router = Router();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

  router.post('/webhooks', async (req: Request, res: Response): Promise<void> => {
    const payload = JSON.stringify(req.body);
    const headers = req.headers;

    // Verify webhook signature
    const svix_id = headers['svix-id'] as string;
    const svix_timestamp = headers['svix-timestamp'] as string;
    const svix_signature = headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ error: 'Missing svix headers' });
      return;
    }

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Clerk webhook verification failed:', err);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const { type, data } = evt;

    try {
      if (type === 'organization.created') {
        console.log('🔄 Clerk organization created:', data.id, data.name);
        
        // Generate slug from organization name
        const slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        // Check if tenant already exists
        const existingTenant = await globalDb.query(
          'SELECT id FROM tenant_registry WHERE clerk_org_id = $1 OR slug = $2',
          [data.id, slug]
        );

        if (existingTenant.rows.length > 0) {
          // Update existing tenant with Clerk org ID
          await globalDb.query(
            'UPDATE tenant_registry SET clerk_org_id = $1 WHERE id = $2',
            [data.id, existingTenant.rows[0].id]
          );
          console.log('✅ Updated existing tenant with Clerk org ID');
        } else {
          // Enqueue new tenant provisioning
          // Note: adminEmail and adminPassword are optional for Clerk-based auth
          await provisioningQueue.enqueue({
            organizationName: data.name,
            adminEmail: data.created_by || '', // First user who created org
            adminPassword: '', // Clerk handles auth - no password needed
            plan: 'free',
            clerkOrgId: data.id
          });
          console.log('✅ Enqueued tenant provisioning for Clerk org:', data.id);
        }
      }

      if (type === 'user.created') {
        console.log('🔄 Clerk user created:', data.id, data.email_addresses?.[0]?.email_address);
        
        const email = data.email_addresses?.[0]?.email_address;
        if (!email) {
          res.json({ success: true, message: 'No email found' });
          return;
        }

        // Check if user already exists
        const existingUser = await globalDb.query(
          'SELECT id FROM global_users WHERE clerk_user_id = $1 OR email = $2',
          [data.id, email]
        );

        if (existingUser.rows.length === 0) {
          // Create user record (will be linked to tenant when they join an org)
          await globalDb.query(
            `INSERT INTO global_users (id, email, clerk_user_id, password_hash, tenant_id, is_active)
             VALUES (gen_random_uuid(), $1, $2, NULL, 
               (SELECT id FROM tenant_registry WHERE clerk_org_id = $3 LIMIT 1),
               true)
             ON CONFLICT (email) DO UPDATE SET clerk_user_id = $2`,
            [email, data.id, data.organization_ids?.[0] || null]
          );
          console.log('✅ Created/updated user with Clerk user ID');
        }
      }

      if (type === 'organizationMembership.created') {
        console.log('🔄 User joined organization:', data.user_id, data.organization_id);
        
        // Link user to tenant
        const tenantResult = await globalDb.query(
          'SELECT id FROM tenant_registry WHERE clerk_org_id = $1',
          [data.organization_id]
        );

        if (tenantResult.rows.length > 0) {
          await globalDb.query(
            `UPDATE global_users 
             SET tenant_id = $1, updated_at = NOW()
             WHERE clerk_user_id = $2`,
            [tenantResult.rows[0].id, data.user_id]
          );
          console.log('✅ Linked user to tenant');
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Clerk webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed', message: error.message });
    }
  });

  return router;
}

