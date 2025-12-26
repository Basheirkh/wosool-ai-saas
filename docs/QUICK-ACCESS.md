# Quick Access Guide

## Your Login Credentials
- **Email**: `ahad@basheer.com`
- **Password**: `12345678`
- **Server**: `http://167.99.20.94:3001`

## Step 1: Login and Get Token

```bash
curl -X POST http://167.99.20.94:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahad@basheer.com",
    "password": "12345678"
  }'
```

**Response includes:**
- `access_token` - Use this for authenticated requests
- `tenant_id` - Your organization ID
- `database_url` - Your tenant database connection string
- `user` - Your user information

## Step 2: Use Your Token

Save your token in a variable:
```bash
TOKEN="your_access_token_here"
```

## Available Endpoints for Your Organization

### ✅ Working Endpoints (No Special Access Required)

**1. Health Check**
```bash
curl http://167.99.20.94:3001/health
```

**2. Login**
```bash
curl -X POST http://167.99.20.94:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahad@basheer.com", "password": "12345678"}'
```

**3. Register New Organization** (if you have permissions)
```bash
curl -X POST http://167.99.20.94:3001/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "New Org",
    "admin_email": "admin@example.com",
    "admin_password": "password123",
    "plan": "free"
  }'
```

### 🔒 Dashboard Endpoints (Require Super Admin)

The `/api/admin/dashboard/*` endpoints require a **Super Admin Key** in the header:

```bash
# You need to set SUPER_ADMIN_KEY in your .env file
# Then use it like this:
curl http://167.99.20.94:3001/api/admin/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: YOUR_SUPER_ADMIN_KEY"
```

### 📊 Your Tenant Database

From the login response, you have:
- **Database URL**: `postgresql://postgres:WC92GIotRsZ4LnGRRSAy3hbFW@tenant-db:5432/twenty_tenant_ahad-organization_157aebf3`
- **Database Name**: `twenty_tenant_ahad-organization_157aebf3`
- **Host**: `167.99.20.94` (external) or `ent-tenant-db` (internal Docker network)
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `WC92GIotRsZ4LnGRRSAy3hbFW`

## Direct Database Access

If you need to access your tenant database directly:

```bash
# From the server
docker exec -it ent-tenant-db psql -U postgres -d twenty_tenant_ahad-organization_157aebf3

# Or from external (if port is exposed)
psql -h 167.99.20.94 -p 5432 -U postgres -d twenty_tenant_ahad-organization_157aebf3
```

## Next Steps

1. **Access Your CRM**: The Twenty CRM service should be accessible through your tenant database
2. **Connect Frontend**: Use the access token to authenticate API requests from your frontend
3. **Set Up Salla Integration**: Use the Salla webhook endpoints to integrate with Salla stores
4. **Monitor Usage**: Check your tenant database for usage statistics

## Example: Complete Workflow

```bash
# 1. Login
RESPONSE=$(curl -s -X POST http://167.99.20.94:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahad@basheer.com", "password": "12345678"}')

# 2. Extract token (requires jq)
TOKEN=$(echo $RESPONSE | jq -r '.data.access_token')

# 3. Use token for authenticated requests
curl http://167.99.20.94:3001/api/admin/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: YOUR_SUPER_ADMIN_KEY"
```

## Troubleshooting

**"Forbidden" Error**: 
- Dashboard endpoints require `x-admin-key` header with `SUPER_ADMIN_KEY`
- Check your `.env` file for `SUPER_ADMIN_KEY` value

**Token Expired**:
- Tokens expire after a set time
- Just login again to get a new token

**Connection Issues**:
- Verify server is running: `curl http://167.99.20.94:3001/health`
- Check Docker containers: `docker ps` on the server

