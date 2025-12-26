/**
 * Twenty CRM Provisioning API
 * 
 * This module provides an API endpoint to properly provision Twenty CRM workspaces
 * when tenants are registered. It ensures all onboarding flags are set correctly
 * so the wizard doesn't appear.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Pool } from 'pg';

const provisionSchema = z.object({
  tenantId: z.string().uuid(),
  workspaceName: z.string().min(1),
  adminEmail: z.string().email(),
  clerkUserId: z.string().optional(),
  clerkOrgId: z.string().optional(),
});

export interface ProvisioningResult {
  success: boolean;
  workspaceId?: string;
  userId?: string;
  message: string;
}

/**
 * Provision Twenty CRM workspace for a tenant
 * 
 * This should be called after tenant database is created.
 * It ensures:
 * 1. Workspace is properly initialized in tenant database
 * 2. All onboarding flags are set to complete
 * 3. User is linked to workspace with proper role
 */
export function createTwentyCRMProvisioningRouter(
  tenantDb: Pool
): Router {
  const router = Router();

  router.post('/provision-twenty-workspace', async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const validated = provisionSchema.parse(req.body);
      const { tenantId, workspaceName, adminEmail, clerkUserId, clerkOrgId } = validated;

      // Get tenant database connection
      // Note: In production, you'd resolve this from tenant registry
      const result = await provisionTwentyWorkspace(
        tenantDb,
        {
          tenantId,
          workspaceName,
          adminEmail,
          clerkUserId,
          clerkOrgId,
        }
      );

      if (result.success) {
        return res.json({
          success: true,
          data: {
            workspaceId: result.workspaceId,
            userId: result.userId,
            message: result.message,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Twenty CRM provisioning error:', error);
      return res.status(500).json({
        error: 'Provisioning failed',
        message: error.message || 'An error occurred during provisioning',
      });
    }
  });

  return router;
}

/**
 * Core provisioning logic
 * 
 * This function properly initializes a Twenty CRM workspace in the tenant database
 * and marks all onboarding flags as complete.
 */
async function provisionTwentyWorkspace(
  tenantDb: Pool,
  params: {
    tenantId: string;
    workspaceName: string;
    adminEmail: string;
    clerkUserId?: string;
    clerkOrgId?: string;
  }
): Promise<ProvisioningResult> {
  const { tenantId, workspaceName, adminEmail, clerkUserId, clerkOrgId } = params;

  try {
    // Start transaction
    await tenantDb.query('BEGIN');

    try {
      // 1. Check if workspace already exists
      const existingWorkspace = await tenantDb.query(
        `SELECT id FROM core.workspace WHERE "displayName" = $1 OR subdomain = $2 LIMIT 1`,
        [workspaceName, workspaceName.toLowerCase().replace(/\s+/g, '-')]
      );

      if (existingWorkspace.rows.length > 0) {
        await tenantDb.query('ROLLBACK');
        return {
          success: false,
          message: 'Workspace already exists for this tenant',
        };
      }

      // 2. Get or create application
      let appId: string;
      const appResult = await tenantDb.query('SELECT id FROM core.application LIMIT 1');
      
      if (appResult.rows.length === 0) {
        const newAppResult = await tenantDb.query(`
          INSERT INTO core.application (id, name, "universalIdentifier")
          VALUES (gen_random_uuid(), 'Default Application', gen_random_uuid()::text)
          RETURNING id
        `);
        appId = newAppResult.rows[0].id;
      } else {
        appId = appResult.rows[0].id;
      }

      // 3. Create default role
      const roleId = require('uuid').v4();
      await tenantDb.query(`
        INSERT INTO core.role (
          id, "workspaceId", label,
          "canUpdateAllSettings", "canAccessAllTools",
          "canReadAllObjectRecords", "canUpdateAllObjectRecords",
          "canSoftDeleteAllObjectRecords", "canDestroyAllObjectRecords"
        ) VALUES ($1, $2, 'Admin', true, true, true, true, true, true)
      `, [roleId, tenantId]); // Using tenantId as workspaceId for now

      // 4. Create workspace with ACTIVE status (bypasses activation flow)
      const workspaceId = tenantId; // Use tenantId as workspaceId for consistency
      const subdomain = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
      
      await tenantDb.query(`
        INSERT INTO core.workspace (
          id, "displayName", subdomain, "activationStatus",
          "databaseUrl", "databaseSchema", "workspaceCustomApplicationId", "defaultRoleId"
        ) VALUES ($1, $2, $3, 'ACTIVE', '', $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          "displayName" = EXCLUDED."displayName",
          "activationStatus" = 'ACTIVE'
      `, [workspaceId, workspaceName, subdomain, `workspace_${subdomain}`, appId, roleId]);

      // 5. Get or create user
      let userId: string;
      const userResult = await tenantDb.query(
        'SELECT id FROM core."user" WHERE email = $1 LIMIT 1',
        [adminEmail.toLowerCase()]
      );

      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        const newUserResult = await tenantDb.query(`
          INSERT INTO core."user" (id, email, "isEmailVerified", "canImpersonate", "canAccessFullAdminPanel")
          VALUES (gen_random_uuid(), $1, true, false, false)
          RETURNING id
        `, [adminEmail.toLowerCase()]);
        userId = newUserResult.rows[0].id;
      }

      // 6. Link user to workspace
      await tenantDb.query(`
        INSERT INTO core."userWorkspace" ("userId", "workspaceId")
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [userId, workspaceId]);

      // 7. Assign role to user
      await tenantDb.query(`
        INSERT INTO core."userRole" ("userWorkspaceId", "roleId")
        SELECT uw.id, $1
        FROM core."userWorkspace" uw
        WHERE uw."userId" = $2 AND uw."workspaceId" = $3
        ON CONFLICT DO NOTHING
      `, [roleId, userId, workspaceId]);

      // 8. Mark all onboarding flags as complete (CRITICAL - prevents wizard)
      // Delete all pending onboarding flags
      await tenantDb.query(`
        DELETE FROM core."keyValuePair"
        WHERE "userId" = $1 
          AND "workspaceId" = $2
          AND key IN (
            'ONBOARDING_CREATE_PROFILE_PENDING',
            'ONBOARDING_CONNECT_ACCOUNT_PENDING',
            'ONBOARDING_INVITE_TEAM_PENDING',
            'ONBOARDING_BOOK_ONBOARDING_PENDING'
          )
      `, [userId, workspaceId]);

      // 9. Store Clerk metadata if provided
      if (clerkUserId || clerkOrgId) {
        await tenantDb.query(`
          INSERT INTO core."keyValuePair" ("userId", "workspaceId", key, value)
          VALUES ($1, $2, 'CLERK_USER_ID', $3),
                 ($1, $2, 'CLERK_ORG_ID', $4)
          ON CONFLICT DO UPDATE SET value = EXCLUDED.value
        `, [userId, workspaceId, clerkUserId || '', clerkOrgId || '']);
      }

      // Commit transaction
      await tenantDb.query('COMMIT');

      return {
        success: true,
        workspaceId,
        userId,
        message: 'Workspace provisioned successfully with onboarding complete',
      };
    } catch (error: any) {
      await tenantDb.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Provisioning error:', error);
    return {
      success: false,
      message: `Failed to provision workspace: ${error.message}`,
    };
  }
}


