# Clerk Integration Changes

## Files Changed

### 1. Schema Updates
- `services/tenant-manager/src/database/global/schema.sql`
  - Added `clerk_org_id VARCHAR(255) UNIQUE` to `tenant_registry`
  - Added `clerk_user_id VARCHAR(255) UNIQUE` to `global_users`
  - Made `password_hash` nullable in `global_users` (Clerk handles auth)
  - Added indexes for Clerk IDs

### 2. New Files
- `services/tenant-manager/src/api/clerk/webhooks.ts` - Clerk webhook handler
- `services/tenant-manager/src/middleware/clerk-auth.ts` - Clerk JWT verification middleware
- `nginx/conf.d/wosool.conf` - Nginx config for api.wosool.ai

### 3. Updated Files
- `services/tenant-manager/package.json` - Added `@clerk/clerk-sdk-node` and `svix`
- `services/tenant-manager/src/index.ts` - Added Clerk webhook route
- `services/tenant-manager/src/services/provisioning-queue.ts` - Added `clerkOrgId` support
- `services/tenant-manager/src/services/tenant-provisioning.ts` - Made email/password optional for Clerk
- `docker-compose.yml` - Added Clerk environment variables

## Environment Variables Required

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZW1lcmdpbmctc2tpbmstNzUuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_kIRXGCc7WeA4MMaAkh6L3d17NbGRB6QkRodqsYHqrm
CLERK_WEBHOOK_SECRET=<get-from-clerk-dashboard>
CRM_BASE_URL=api.wosool.ai
```

## Clerk Dashboard Setup

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://api.wosool.ai/api/clerk/webhooks`
3. Enable events:
   - `organization.created`
   - `user.created`
   - `organizationMembership.created`
4. Copy the webhook signing secret to `CLERK_WEBHOOK_SECRET`

## Flow

1. User visits `api.wosool.ai/welcome`
2. Clerk handles sign-in/sign-up
3. When organization is created → Clerk webhook → Tenant provisioned
4. User stays on `api.wosool.ai` (no subdomain redirect)
5. Tenant context handled via headers/cookies

