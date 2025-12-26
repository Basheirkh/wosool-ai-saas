# 🔧 Clerk Integration Guide - Fixing Redirect Loop

## ✅ What Was Fixed

### 1. Created `clerk-unified.ts` Middleware
**Location:** `twenty-crm-forked/packages/twenty-server/src/bridge/clerk-unified.ts`

This middleware:
- ✅ Prevents redirect loops by checking if user is already on `/welcome` or `/sign-in`
- ✅ Handles `__clerk_db_jwt` token from Clerk redirects
- ✅ Resolves tenant from Clerk organization
- ✅ Redirects unauthenticated users to `/welcome`

### 2. Updated `docker-compose.yml`
Added Clerk environment variables to `twenty-crm` service:
```yaml
- CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}
- CLERK_SECRET_KEY=${CLERK_SECRET_KEY:-}
- CLERK_SIGN_IN_URL=/welcome
- CLERK_SIGN_UP_URL=/welcome
- CLERK_AFTER_SIGN_IN_URL=/
- CLERK_AFTER_SIGN_UP_URL=/welcome
```

### 3. Fixed `ClerkAuthWrapper.tsx`
- Improved instance extraction from base64-encoded publishable key
- Added fallback for `emerging-skink-75` instance
- Better error handling for key parsing

## 🚀 Integration Steps

### Step 1: Install Clerk SDK (if not already installed)

```bash
cd twenty-crm-forked/packages/twenty-server
npm install @clerk/clerk-sdk-node
# or
yarn add @clerk/clerk-sdk-node
```

### Step 2: Integrate Middleware into NestJS

Since Twenty CRM uses NestJS (not Express directly), you have two options:

#### Option A: Create a NestJS Guard

Create `twenty-crm-forked/packages/twenty-server/src/engine/guards/clerk-auth.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { clerkAuthMiddleware, handleUnifiedTenantContext } from '../../bridge/clerk-unified';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // First apply Clerk auth middleware
    return new Promise((resolve) => {
      clerkAuthMiddleware(req, res, async () => {
        // Then handle tenant context
        await handleUnifiedTenantContext(req, res, () => {
          resolve(true);
        });
      });
    });
  }
}
```

#### Option B: Use as Express Middleware in `main.ts`

In `twenty-crm-forked/packages/twenty-server/src/main.ts`, add:

```typescript
import { clerkAuthMiddleware, handleUnifiedTenantContext } from './bridge/clerk-unified';

// After app creation, before app.listen()
if (process.env.CLERK_SECRET_KEY) {
  app.use(clerkAuthMiddleware);
  app.use(handleUnifiedTenantContext);
}
```

### Step 3: Configure Environment Variables

Ensure your `.env` file has:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZW1lcmdpbmctc2tpbmstNzUuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs (optional, defaults are set in docker-compose.yml)
CLERK_SIGN_IN_URL=/welcome
CLERK_SIGN_UP_URL=/welcome
CLERK_AFTER_SIGN_IN_URL=/
CLERK_AFTER_SIGN_UP_URL=/welcome
```

### Step 4: Configure Clerk Dashboard

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Configure → Paths**:
   - Sign-in URL: `/welcome` or `/sign-in`
   - Sign-up URL: `/welcome` or `/sign-up`
3. **Configure → Domains**:
   - Add: `http://localhost:3000` (development)
   - Add your production domain

### Step 5: Rebuild and Test

```bash
# Rebuild containers
docker-compose up -d --build

# Or if running locally
cd twenty-crm-forked
yarn build
yarn start
```

## 🐛 Troubleshooting

### Issue: 401 Unauthorized from Clerk

**Symptoms:**
```
POST https://flying-arachnid-17.clerk.accounts.dev/v1/environment 401
```

**Solutions:**
1. Verify `CLERK_SECRET_KEY` is correct in `.env`
2. Check that the instance name matches (should be `emerging-skink-75` based on your key)
3. Ensure Clerk keys are from the same Clerk application

### Issue: Redirect Loop

**Symptoms:**
- Page keeps redirecting between `/welcome` and Clerk

**Solutions:**
1. Check that `clerk-unified.ts` is properly integrated
2. Verify `CLERK_SIGN_IN_URL` and `CLERK_AFTER_SIGN_IN_URL` are set correctly
3. Clear browser cookies and localStorage
4. Check browser console for errors

### Issue: `tokenPair is undefined`

**Symptoms:**
- Console shows `tokenPair is undefined`
- User not logged in after Clerk authentication

**Solutions:**
1. Verify token bridge endpoint is accessible: `http://localhost:3001/api/clerk/auth/token`
2. Check that `tenant-manager` service is running
3. Verify Clerk token is being passed correctly in the redirect

### Issue: `core.workspace` does not exist

**Symptoms:**
```
ApolloError: relation "core.workspace" does not exist
```

**Solutions:**
1. Ensure template database is initialized
2. Run migrations: `docker exec -it wosool-twenty-crm npm run migration:run`
3. Verify `PG_DATABASE_URL` points to the correct database

## 📝 How It Works

1. **User visits `/sign-in`**
   - `ClerkAuthWrapper` detects Clerk is enabled
   - Redirects to Clerk's hosted sign-in page

2. **User authenticates with Clerk**
   - Clerk creates session
   - Redirects back to app with `__clerk_db_jwt` token

3. **Backend processes token**
   - `clerkAuthMiddleware` verifies Clerk session
   - `handleUnifiedTenantContext` resolves tenant from org
   - Prevents redirect loop by checking current path

4. **Frontend converts token**
   - `ClerkAuthWrapper` calls `/api/clerk/auth/token`
   - Token bridge converts to Twenty CRM format
   - Sets `tokenPair` cookie

5. **User logged in** ✅

## 🔍 Key Files

- `twenty-crm-forked/packages/twenty-server/src/bridge/clerk-unified.ts` - Backend middleware
- `twenty-crm-forked/packages/twenty-front/src/modules/auth/components/ClerkAuthWrapper.tsx` - Frontend redirect
- `services/tenant-manager/src/api/clerk/auth.ts` - Token bridge API
- `docker-compose.yml` - Environment configuration

## ✅ Checklist

- [ ] `@clerk/clerk-sdk-node` installed in `twenty-server`
- [ ] `clerk-unified.ts` integrated into NestJS app
- [ ] Clerk environment variables set in `.env`
- [ ] Clerk dashboard configured (paths & domains)
- [ ] Containers rebuilt
- [ ] Test sign-in flow
- [ ] Verify no redirect loops
- [ ] Check token conversion works

---

**Need Help?** Check the console errors and verify each step above. The most common issues are:
1. Missing Clerk SDK installation
2. Incorrect environment variables
3. Middleware not properly integrated
4. Clerk dashboard misconfiguration

