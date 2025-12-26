# 🔄 Complete Clerk & Tenant Manager Revision

## Overview

This document outlines the complete revision of Clerk authentication and tenant manager integration with Twenty CRM to fix:
- `tokenPair is undefined` errors
- `relation "core.workspace" does not exist` errors
- Clerk 401 Unauthorized errors
- Redirect loops

## Key Changes

### 1. Revised Clerk Auth Service (`clerk-auth.service.ts`)

**Problems Fixed:**
- ✅ Properly handles `__clerk_db_jwt` tokens (not standard JWTs)
- ✅ Exchanges Clerk DB JWT for session info via Clerk API
- ✅ Ensures workspace exists before token generation
- ✅ Generates `ACCESS` tokens (not `WORKSPACE_AGNOSTIC`) with proper workspace info

**Key Improvements:**
```typescript
// Now handles Clerk DB JWT properly
if (clerkToken.startsWith('dvb_')) {
  sessionInfo = await this.getClerkSessionInfo(clerkToken);
}

// Ensures workspace exists
const workspaceCheck = await tenantDb.query(
  `SELECT id FROM core.workspace WHERE id = $1 LIMIT 1`,
  [workspaceId]
);

// Generates ACCESS token with workspace info
const accessTokenPayload = {
  sub: userId,
  userId: userId,
  workspaceId: tenant.workspaceId,
  userWorkspaceId: userWorkspaceId,
  authProvider: 'clerk',
  type: 'ACCESS', // Not WORKSPACE_AGNOSTIC
};
```

### 2. Updated Frontend Token Handling (`ClerkAuthWrapper.tsx`)

**Problems Fixed:**
- ✅ Better error handling and logging
- ✅ Sets tokenPair in both cookie and localStorage
- ✅ Proper cleanup of URL parameters
- ✅ Clear error messages for debugging

### 3. Workspace Creation During Provisioning

**Ensured:**
- ✅ Workspace is created with `ACTIVE` status
- ✅ User is linked to workspace via `userWorkspace`
- ✅ Role is created and assigned
- ✅ All required tables exist before token generation

## Flow Diagram

```
1. User visits /sign-in
   ↓
2. ClerkAuthWrapper redirects to Clerk
   ↓
3. User authenticates with Clerk
   ↓
4. Clerk redirects back with __clerk_db_jwt
   ↓
5. Frontend calls /api/clerk/auth/token
   ↓
6. ClerkAuthService:
   - Exchanges __clerk_db_jwt for session info
   - Resolves tenant from Clerk org_id
   - Ensures workspace exists
   - Creates/links user to workspace
   - Generates Twenty CRM ACCESS token
   ↓
7. Frontend sets tokenPair cookie
   ↓
8. User logged into Twenty CRM ✅
```

## Environment Variables Required

```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_API_URL=https://api.clerk.dev  # Optional, defaults to this

# JWT Secret (must match Twenty CRM)
JWT_SECRET=your-secret-key

# Database
POSTGRES_HOST=tenant-db
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=...
GLOBAL_DATABASE_URL=postgresql://...
```

## Troubleshooting

### Issue: `tokenPair is undefined`

**Causes:**
1. Token conversion failed
2. Cookie not being set
3. Token format incorrect

**Solutions:**
1. Check browser console for token conversion errors
2. Verify `/api/clerk/auth/token` endpoint is accessible
3. Check that `tokenPair` cookie is set in DevTools → Application → Cookies
4. Verify token format matches Twenty CRM expectations

### Issue: `relation "core.workspace" does not exist`

**Causes:**
1. Tenant database not properly initialized
2. Workspace not created during provisioning
3. Schema not copied from template

**Solutions:**
1. Verify tenant database exists: `SELECT * FROM tenant_registry WHERE clerk_org_id = '...'`
2. Check workspace exists: `SELECT * FROM core.workspace LIMIT 1` (in tenant DB)
3. Re-run provisioning if needed
4. Ensure template database (`twenty_tenant_template`) has proper schema

### Issue: Clerk 401 Unauthorized

**Causes:**
1. Invalid `CLERK_SECRET_KEY`
2. `__clerk_db_jwt` token expired or invalid
3. Clerk API endpoint incorrect

**Solutions:**
1. Verify `CLERK_SECRET_KEY` is correct in `.env`
2. Check token hasn't expired (Clerk tokens expire quickly)
3. Verify Clerk API URL is correct
4. Check Clerk dashboard for API key status

### Issue: Tenant not found

**Causes:**
1. Clerk organization not linked to tenant
2. Organization not provisioned
3. `clerk_org_id` not set in `tenant_registry`

**Solutions:**
1. Check `tenant_registry` table: `SELECT * FROM tenant_registry WHERE clerk_org_id = '...'`
2. Ensure Clerk webhook is processing `organization.created` events
3. Manually link organization: `UPDATE tenant_registry SET clerk_org_id = '...' WHERE id = '...'`

## Testing Checklist

- [ ] Clerk publishable key set in frontend
- [ ] Clerk secret key set in tenant-manager
- [ ] Tenant provisioned with Clerk org ID
- [ ] Workspace exists in tenant database
- [ ] User exists in both global_users and tenant database
- [ ] Token conversion endpoint accessible
- [ ] TokenPair cookie set after conversion
- [ ] No redirect loops
- [ ] User can access Twenty CRM after auth

## Next Steps

1. **Rebuild Services:**
   ```bash
   docker-compose build tenant-manager
   docker-compose build twenty-crm
   docker-compose up -d
   ```

2. **Test Flow:**
   - Visit `http://localhost:3000/`
   - Should redirect to Clerk
   - After auth, should return and log in
   - Check browser console for errors
   - Verify tokenPair cookie is set

3. **Monitor Logs:**
   ```bash
   docker-compose logs -f tenant-manager
   docker-compose logs -f twenty-crm
   ```

## Files Modified

- ✅ `services/tenant-manager/src/services/clerk-auth.service.ts` - Complete rewrite
- ✅ `services/tenant-manager/src/api/clerk/auth.ts` - Token endpoint
- ✅ `twenty-crm-forked/packages/twenty-front/src/modules/auth/components/ClerkAuthWrapper.tsx` - Frontend handling

## Notes

- The `__clerk_db_jwt` token is NOT a standard JWT - it's a Clerk database token that needs special handling
- Workspace MUST exist before token generation
- Token MUST include `workspaceId` and `userWorkspaceId` for Twenty CRM
- Token type MUST be `ACCESS` (not `WORKSPACE_AGNOSTIC`) for proper authentication

