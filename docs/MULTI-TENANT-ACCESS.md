# 🔐 Multi-Tenant Access Guide

## Problem
When you register a tenant via the API, the user is created in the **tenant-specific database**, but the Twenty CRM frontend at `localhost:3000` is connected to the **template database**. This causes authentication issues.

## Solution: Use Access Token from Registration

When you register a tenant, you receive an `access_token`. Use this token to authenticate with the Twenty CRM.

### Step 1: Register Your Tenant

```bash
curl -X POST http://localhost:3001/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Apple",
    "admin_email": "admin@apple.com",
    "admin_password": "securepassword"
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

**Option A: Use Browser with Token (Recommended)**

1. Open browser console at `http://localhost:3000`
2. Set the token in localStorage:
   ```javascript
   localStorage.setItem('accessToken', 'YOUR_ACCESS_TOKEN_HERE');
   localStorage.setItem('refreshToken', 'YOUR_ACCESS_TOKEN_HERE');
   ```
3. Refresh the page

**Option B: Use API Directly**

The Twenty CRM GraphQL/REST API can be accessed with the token:

```bash
TOKEN="your-access-token-here"

# GraphQL query
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ me { id email } }"}'
```

## Alternative: Login via Tenant Manager API

You can also login to get a fresh token:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apple.com",
    "password": "securepassword"
  }'
```

## Creating Multiple Tenants

Each tenant registration creates a **separate database**:

1. **First Tenant (Apple):**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register-organization \
     -H "Content-Type: application/json" \
     -d '{
       "organization_name": "Apple",
       "admin_email": "admin@apple.com",
       "admin_password": "password123"
     }'
   ```
   - Database: `twenty_tenant_apple_xxxxx`
   - Token: `token1`

2. **Second Tenant (Microsoft):**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register-organization \
     -H "Content-Type: application/json" \
     -d '{
       "organization_name": "Microsoft",
       "admin_email": "admin@microsoft.com",
       "admin_password": "password123"
     }'
   ```
   - Database: `twenty_tenant_microsoft_xxxxx`
   - Token: `token2`

3. **Switch Between Tenants:**
   - Use the appropriate token for each tenant
   - Each token is scoped to its tenant database

## Current Limitation

The Twenty CRM frontend (`localhost:3000`) is currently hardcoded to the template database. To fully support multi-tenant in the UI, you would need to:

1. Configure Twenty CRM to dynamically connect to tenant databases
2. Or use a custom frontend that routes to the correct tenant based on the token

## Quick Fix: Access via API

For now, use the API directly with your access token:

```bash
# Get your tenant's data
curl http://localhost:3001/api/admin/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

## Database Access

Each tenant has its own isolated database:

```bash
# List all tenant databases
docker exec wosool-tenant-db psql -U postgres -c "\l" | grep twenty_tenant

# Access specific tenant database
docker exec -it wosool-tenant-db psql -U postgres -d "twenty_tenant_apple_4ec22345"
```


