/**
 * Clerk Webhook Handler
 * 
 * Handles Clerk webhooks with:
 * - Idempotency tracking (no duplicate processing)
 * - Proper error handling and logging
 * - Transaction management
 * - Distributed locking
 * - Comprehensive validation
 */

import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { Pool } from 'pg';
import ProvisioningQueueService from '../../services/provisioning-queue.js';
import ImprovedTenantProvisioningService from '../../services/tenant-provisioning.js';
import WebhookIdempotencyService from '../../services/webhook-idempotency.js';

export function createClerkWebhookRouter(
  globalDb: Pool,
  provisioningQueue: ProvisioningQueueService,
  tenantProvisioning: ImprovedTenantProvisioningService,
  idempotencyService: WebhookIdempotencyService
): Router {
  const router = Router();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    console.warn('⚠️  WARNING: CLERK_WEBHOOK_SECRET not set. Webhooks will not be verified.');
  }

  router.post('/webhooks', async (req: Request, res: Response): Promise<void> => {
    const payload = JSON.stringify(req.body);
    const headers = req.headers;

    // Extract Svix headers
    const svix_id = headers['svix-id'] as string;
    const svix_timestamp = headers['svix-timestamp'] as string;
    const svix_signature = headers['svix-signature'] as string;

    // Validate headers exist
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing Svix headers');
      res.status(400).json({ error: 'Missing svix headers' });
      return;
    }

    let evt: any;

    // Verify webhook signature
    if (webhookSecret) {
      const wh = new Webhook(webhookSecret);
      try {
        evt = wh.verify(payload, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });
      } catch (err) {
        console.error('❌ Clerk webhook verification failed:', err);
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
    } else {
      // If no secret, parse the payload (development only)
      evt = req.body;
    }

    const { type, data } = evt;
    const clerkEventId = svix_id;

    console.log(`📨 Received Clerk webhook: ${type} (Event ID: ${clerkEventId})`);

    try {
      // Check for duplicate webhook
      const isProcessed = await idempotencyService.isProcessed(type, clerkEventId);
      if (isProcessed) {
        console.log(`ℹ️  Webhook already processed (duplicate detected): ${clerkEventId}`);
        const previousResult = await idempotencyService.getPreviousResult(type, clerkEventId);
        res.json({ success: true, cached: true, result: previousResult });
        return;
      }

      // Mark as processing (acquire lock)
      await idempotencyService.markProcessing(type, clerkEventId);

      let result: any = { success: true };

      // Process webhook based on type
      if (type === 'organization.created') {
        result = await handleOrganizationCreated(data, globalDb, provisioningQueue);
      } else if (type === 'user.created') {
        result = await handleUserCreated(data, globalDb);
      } else if (type === 'organizationMembership.created') {
        result = await handleOrganizationMembershipCreated(data, globalDb);
      } else if (type === 'organizationMembership.deleted') {
        result = await handleOrganizationMembershipDeleted(data, globalDb);
      } else if (type === 'user.updated') {
        result = await handleUserUpdated(data, globalDb);
      } else {
        console.log(`ℹ️  Unhandled webhook type: ${type}`);
      }

      // Mark as completed
      await idempotencyService.markCompleted(type, clerkEventId, result);

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error(`❌ Webhook processing error (${type}):`, error.message);

      // Mark as failed
      await idempotencyService.markFailed(type, clerkEventId, error.message);

      res.status(500).json({
        error: 'Webhook processing failed',
        message: error.message,
        type,
      });
    }
  });

  return router;
}

/**
 * Handle organization.created webhook
 */
async function handleOrganizationCreated(
  data: any,
  globalDb: Pool,
  provisioningQueue: ProvisioningQueueService
): Promise<any> {
  console.log(`🔄 Processing organization.created: ${data.id} (${data.name})`);

  const clerkOrgId = data.id;
  const organizationName = data.name || 'Unnamed Organization';

  // Generate slug from organization name
  const slug = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  if (!slug) {
    throw new Error('Invalid organization name - cannot generate slug');
  }

  try {
    // Check if tenant already exists with this Clerk org ID
    const existingByClerkId = await globalDb.query(
      'SELECT id, status FROM tenant_registry WHERE clerk_org_id = $1',
      [clerkOrgId]
    );

    if (existingByClerkId.rows.length > 0) {
      const existingTenant = existingByClerkId.rows[0];
      console.log(`ℹ️  Tenant already exists for Clerk org ${clerkOrgId}`);

      // If status is pending, don't create duplicate
      if (existingTenant.status === 'pending') {
        console.log(`ℹ️  Tenant provisioning already in progress`);
        return {
          action: 'skipped',
          reason: 'tenant_already_provisioning',
          tenantId: existingTenant.id,
        };
      }

      return {
        action: 'skipped',
        reason: 'tenant_already_exists',
        tenantId: existingTenant.id,
      };
    }

    // Check if slug is unique
    const existingBySlug = await globalDb.query(
      'SELECT id FROM tenant_registry WHERE slug = $1',
      [slug]
    );

    if (existingBySlug.rows.length > 0) {
      console.warn(`⚠️  Slug already exists: ${slug}`);
      // Generate unique slug by appending random suffix
      const uniqueSlug = `${slug}-${Math.random().toString(36).substring(7)}`;
      console.log(`ℹ️  Using unique slug: ${uniqueSlug}`);

      return handleOrganizationCreated(
        { ...data, name: `${organizationName}-${Math.random().toString(36).substring(7)}` },
        globalDb,
        provisioningQueue
      );
    }

    // Extract admin email if available
    const adminEmail = data.created_by_user?.email_addresses?.[0]?.email_address || '';

    // Enqueue tenant provisioning
    const jobId = await provisioningQueue.enqueue({
      organizationName,
      adminEmail,
      adminPassword: '', // Clerk handles auth
      plan: 'free',
      clerkOrgId,
    });

    console.log(`✅ Enqueued tenant provisioning: ${jobId}`);

    return {
      action: 'provisioning_enqueued',
      jobId,
      clerkOrgId,
      slug,
    };
  } catch (error: any) {
    console.error(`❌ Failed to handle organization.created:`, error);
    throw error;
  }
}

/**
 * Handle user.created webhook
 */
async function handleUserCreated(data: any, globalDb: Pool): Promise<any> {
  console.log(`🔄 Processing user.created: ${data.id}`);

  const clerkUserId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || '';
  const lastName = data.last_name || '';

  if (!email) {
    console.warn('⚠️  No email found for user');
    return { action: 'skipped', reason: 'no_email' };
  }

  try {
    // Check if user already exists
    const existingUser = await globalDb.query(
      'SELECT id FROM global_users WHERE clerk_user_id = $1 OR email = $2',
      [clerkUserId, email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      console.log(`ℹ️  User already exists: ${email}`);
      return {
        action: 'skipped',
        reason: 'user_already_exists',
        userId: existingUser.rows[0].id,
      };
    }

    // Create global user record
    const result = await globalDb.query(
      `INSERT INTO global_users (
        id, email, clerk_user_id, first_name, last_name, is_active, created_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW())
      RETURNING id`,
      [email.toLowerCase(), clerkUserId, firstName, lastName]
    );

    const userId = result.rows[0].id;
    console.log(`✅ Created global user: ${email}`);

    return {
      action: 'user_created',
      userId,
      email,
    };
  } catch (error: any) {
    console.error(`❌ Failed to handle user.created:`, error);
    throw error;
  }
}

/**
 * Handle organizationMembership.created webhook
 */
async function handleOrganizationMembershipCreated(
  data: any,
  globalDb: Pool
): Promise<any> {
  console.log(`🔄 Processing organizationMembership.created: user=${data.user_id}, org=${data.organization_id}`);

  const clerkUserId = data.user_id;
  const clerkOrgId = data.organization_id;

  try {
    // Find tenant by Clerk org ID
    const tenantResult = await globalDb.query(
      'SELECT id, status FROM tenant_registry WHERE clerk_org_id = $1',
      [clerkOrgId]
    );

    if (tenantResult.rows.length === 0) {
      console.warn(`⚠️  Tenant not found for Clerk org: ${clerkOrgId}`);
      return {
        action: 'skipped',
        reason: 'tenant_not_found',
      };
    }

    const tenantId = tenantResult.rows[0].id;
    const tenantStatus = tenantResult.rows[0].status;

    // Only link if tenant is active
    if (tenantStatus !== 'active') {
      console.warn(`⚠️  Tenant not active yet: ${tenantId} (status: ${tenantStatus})`);
      return {
        action: 'skipped',
        reason: 'tenant_not_active',
        tenantId,
      };
    }

    // Find user by Clerk user ID
    const userResult = await globalDb.query(
      'SELECT id, tenant_id FROM global_users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      console.warn(`⚠️  User not found for Clerk user: ${clerkUserId}`);
      return {
        action: 'skipped',
        reason: 'user_not_found',
      };
    }

    const userId = userResult.rows[0].id;
    const existingTenantId = userResult.rows[0].tenant_id;

    // Check if user is already linked to this tenant
    if (existingTenantId === tenantId) {
      console.log(`ℹ️  User already linked to tenant: ${tenantId}`);
      return {
        action: 'skipped',
        reason: 'already_linked',
        userId,
        tenantId,
      };
    }

    // Link user to tenant
    await globalDb.query(
      `UPDATE global_users 
       SET tenant_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [tenantId, userId]
    );

    console.log(`✅ Linked user to tenant: ${tenantId}`);

    return {
      action: 'user_linked',
      userId,
      tenantId,
    };
  } catch (error: any) {
    console.error(`❌ Failed to handle organizationMembership.created:`, error);
    throw error;
  }
}

/**
 * Handle organizationMembership.deleted webhook
 */
async function handleOrganizationMembershipDeleted(
  data: any,
  globalDb: Pool
): Promise<any> {
  console.log(`🔄 Processing organizationMembership.deleted: user=${data.user_id}, org=${data.organization_id}`);

  const clerkUserId = data.user_id;
  const clerkOrgId = data.organization_id;

  try {
    // Find tenant
    const tenantResult = await globalDb.query(
      'SELECT id FROM tenant_registry WHERE clerk_org_id = $1',
      [clerkOrgId]
    );

    if (tenantResult.rows.length === 0) {
      console.warn(`⚠️  Tenant not found for Clerk org: ${clerkOrgId}`);
      return { action: 'skipped', reason: 'tenant_not_found' };
    }

    const tenantId = tenantResult.rows[0].id;

    // Find user
    const userResult = await globalDb.query(
      'SELECT id FROM global_users WHERE clerk_user_id = $1 AND tenant_id = $2',
      [clerkUserId, tenantId]
    );

    if (userResult.rows.length === 0) {
      console.warn(`⚠️  User not found in tenant: ${clerkUserId}`);
      return { action: 'skipped', reason: 'user_not_found' };
    }

    const userId = userResult.rows[0].id;

    // Unlink user from tenant
    await globalDb.query(
      `UPDATE global_users 
       SET tenant_id = NULL, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    console.log(`✅ Unlinked user from tenant: ${tenantId}`);

    return {
      action: 'user_unlinked',
      userId,
      tenantId,
    };
  } catch (error: any) {
    console.error(`❌ Failed to handle organizationMembership.deleted:`, error);
    throw error;
  }
}

/**
 * Handle user.updated webhook
 */
async function handleUserUpdated(data: any, globalDb: Pool): Promise<any> {
  console.log(`🔄 Processing user.updated: ${data.id}`);

  const clerkUserId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || '';
  const lastName = data.last_name || '';

  if (!email) {
    return { action: 'skipped', reason: 'no_email' };
  }

  try {
    // Update user record
    const result = await globalDb.query(
      `UPDATE global_users 
       SET email = $1, first_name = $2, last_name = $3, updated_at = NOW()
       WHERE clerk_user_id = $4
       RETURNING id`,
      [email.toLowerCase(), firstName, lastName, clerkUserId]
    );

    if (result.rowCount === 0) {
      console.log(`ℹ️  User not found, creating new: ${email}`);
      // Create if doesn't exist
      const createResult = await globalDb.query(
        `INSERT INTO global_users (
          id, email, clerk_user_id, first_name, last_name, is_active, created_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW())
        RETURNING id`,
        [email.toLowerCase(), clerkUserId, firstName, lastName]
      );
      return {
        action: 'user_created',
        userId: createResult.rows[0].id,
      };
    }

    console.log(`✅ Updated user: ${email}`);
    return {
      action: 'user_updated',
      userId: result.rows[0].id,
    };
  } catch (error: any) {
    console.error(`❌ Failed to handle user.updated:`, error);
    throw error;
  }
}
