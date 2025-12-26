# 🔐 How to Access Your Multi-Tenant SaaS Platform

## Current Issue
The Twenty CRM frontend at `http://localhost:3000` is showing "Welcome to df" which means it's connected to a default/test workspace, not your tenant-specific workspace.

## Solution: Use Access Token Authentication

### Step 1: Get Your Tenant Access Token

When you register a tenant, you receive an `access_token`:

```bash
curl -X POST http://localhost:3001/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "My Company",
    "admin_email": "admin@mycompany.com",
    "admin_password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "tenant_id": "...",
    "user": {...}
  }
}
```

### Step 2: Access Twenty CRM with Token

**Option A: Browser Console Method (Quick Test)**

1. Open `http://localhost:3000` in your browser
2. Open Developer Console (F12)
3. Run this JavaScript:

```javascript
// Set the access token
const token = "YOUR_ACCESS_TOKEN_HERE";
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', token);

// Reload the page
window.location.reload();
```

**Option B: Use API Directly**

The Twenty CRM GraphQL API can be accessed with your token:

```bash
TOKEN="your-access-token-here"

# Get current user info
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ me { id email } }"
  }'
```

### Step 3: Login to Different Tenants

To switch to a different tenant, login via the tenant-manager API:

```bash
# Login to Apple tenant
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apple.com",
    "password": "securepassword"
  }'

# Use the new access_token from response
```

## Current Tenants

List all registered tenants:

```bash
curl http://localhost:3001/api/admin/tenants \
  -H "X-Admin-Key: YOUR_SUPER_ADMIN_KEY"
```

Or check database directly:

```bash
docker exec wosool-global-db psql -U postgres -d twenty_global -c \
  "SELECT slug, name, status FROM tenant_registry ORDER BY created_at DESC;"
```

## Why "Welcome to df" Appears

The "Welcome to df" message appears because:
1. Twenty CRM frontend is connected to the template database
2. It's showing a default/test workspace
3. Your tenant workspaces are in separate databases

## Proper Multi-Tenant Access

For proper multi-tenant access, you need to:

1. **Configure Twenty CRM** to use tenant-specific databases
2. **Use Clerk authentication** to resolve tenant from JWT
3. **Route requests** to the correct tenant database

### Current Architecture

```
┌─────────────┐
│   Clerk     │ → JWT with org_id
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ Tenant Manager   │ → Resolves tenant from JWT
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Tenant Database │ → twenty_tenant_apple_xxxxx
└──────────────────┘
```

### Future: Full Integration

To make Twenty CRM work with Clerk and multi-tenancy:

1. **Modify Twenty CRM** to accept tenant context
2. **Create middleware** that resolves tenant from Clerk JWT
3. **Route database connections** based on tenant

## Quick Access for Testing

For now, to test your tenant:

1. **Register/login** via tenant-manager API
2. **Get access_token**
3. **Use token in browser** (Option A above)
4. **Or use API directly** (Option B above)

## Troubleshooting

**"Welcome to df" still shows:**
- Clear browser localStorage: `localStorage.clear()`
- Set token again and reload

**Token not working:**
- Check token is valid: `curl http://localhost:3001/health`
- Verify tenant exists: Check tenant_registry table
- Check workspace status: Should be `ACTIVE`

**Can't access tenant data:**
- Verify tenant database exists
- Check workspace is ACTIVE in tenant database
- Ensure user is linked to workspace

