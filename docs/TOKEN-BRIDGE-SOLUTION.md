# 🔗 Token Bridge Solution

## Problem
- Tenant-manager JWT tokens don't have the `type` field that Twenty CRM requires
- Twenty CRM expects: `ACCESS`, `WORKSPACE_AGNOSTIC`, `API_KEY`, or `APPLICATION`
- Direct use of tenant-manager tokens causes "Invalid token type" error

## Solution Options

### Option 1: Use Twenty CRM's GraphQL API (Recommended for Testing)

Since Twenty CRM is connected to the template database, you can login directly via GraphQL:

```bash
# Login via Twenty CRM GraphQL
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation SignIn($email: String!, $password: String!) { signIn(email: $email, password: $password) { tokens { accessOrWorkspaceAgnosticToken { token expiresAt } refreshToken { token expiresAt } } } }",
    "variables": {
      "email": "admin@successtest.com",
      "password": "password123"
    }
  }'
```

**Note:** This only works if the user exists in the template database (`twenty_tenant_template`), not in tenant-specific databases.

### Option 2: Create Token Bridge Endpoint

Create an endpoint in tenant-manager that:
1. Validates tenant-manager JWT
2. Looks up user in tenant database
3. Generates Twenty CRM-compatible token
4. Returns token in correct format

### Option 3: Configure Twenty CRM for Multi-Tenant

The proper solution is to:
1. Configure Twenty CRM to accept tenant context
2. Create middleware that resolves tenant from token
3. Connect to correct tenant database based on token

## Current Limitation

**The fundamental issue:** 
- Twenty CRM is hardcoded to use `twenty_tenant_template` database
- Your tenants are in separate databases (`twenty_tenant_apple_xxxxx`, etc.)
- There's no connection between tenant-manager tokens and Twenty CRM's database

## Workaround: Use API Directly

For now, use the tenant-manager API directly:

```bash
# Get data via tenant-manager API
TOKEN="your-tenant-manager-token"

curl http://localhost:3001/api/admin/tenants \
  -H "Authorization: Bearer $TOKEN"
```

The frontend integration requires architectural changes to work properly.


