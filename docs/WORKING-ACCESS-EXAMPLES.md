# Working Access Examples

## ✅ Your Credentials

- **Email**: `ahad@basheer.com`
- **Password**: `12345678`
- **Server**: `http://167.99.20.94:3001`
- **Tenant ID**: `a070d84e-5690-48fc-b5f9-c705a9343b72`
- **Super Admin Key**: `Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4=`

---

## 1. Login and Get Access Token

```bash
curl -X POST http://167.99.20.94:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahad@basheer.com",
    "password": "12345678"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "tenant_id": "a070d84e-5690-48fc-b5f9-c705a9343b72",
    "database_url": "postgresql://postgres:...@tenant-db:5432/twenty_tenant_ahad-organization_157aebf3",
    "user": {
      "id": "43336596-8c93-49c6-9a1a-020076751f78",
      "email": "ahad@basheer.com",
      "role": "ADMIN"
    }
  }
}
```

---

## 2. Access Dashboard (Requires Both Token + Admin Key)

```bash
# Set variables
TOKEN="your_access_token_from_login"
ADMIN_KEY="Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4="

# Get Dashboard Overview
curl http://167.99.20.94:3001/api/admin/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "tenants": {
    "active": "1",
    "suspended": "0",
    "pending": "0",
    "total": "1"
  },
  "usage": {
    "total_storage": "0",
    "total_users": "0",
    "total_api_calls": "0",
    "total_workflows": "0"
  },
  "recentActivity": [
    {
      "slug": "ahad-organization",
      "name": "Ahad Organization",
      "last_activity": null
    }
  ],
  "cache": {
    "connected": true,
    "totalKeys": 0,
    "memoryUsed": "1.36M"
  },
  "timestamp": "2025-12-24T12:45:31.006Z"
}
```

---

## 3. Get Your Tenant Details

```bash
TOKEN="your_access_token"
ADMIN_KEY="Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4="

curl http://167.99.20.94:3001/api/admin/dashboard/tenant/a070d84e-5690-48fc-b5f9-c705a9343b72 \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json"
```

---

## 4. Access Your Tenant Database Directly

### From Your Local Machine (via SSH)

```bash
# Connect to database
ssh root@167.99.20.94 "docker exec -it ent-tenant-db psql -U postgres -d twenty_tenant_ahad-organization_157aebf3"

# Or run a query directly
ssh root@167.99.20.94 "docker exec ent-tenant-db psql -U postgres -d twenty_tenant_ahad-organization_157aebf3 -c 'SELECT * FROM core.workspace;'"
```

### From the Server

```bash
# Connect to database
docker exec -it ent-tenant-db psql -U postgres -d twenty_tenant_ahad-organization_157aebf3

# List all tables
\dt core.*

# Query workspace
SELECT * FROM core.workspace;

# Query users
SELECT * FROM core."user";
```

---

## 5. Complete Working Example Script

```bash
#!/bin/bash

# Configuration
SERVER="http://167.99.20.94:3001"
EMAIL="ahad@basheer.com"
PASSWORD="12345678"
ADMIN_KEY="Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4="

# Step 1: Login
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $SERVER/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract token (requires jq)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
TENANT_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.tenant_id')

echo "✅ Logged in!"
echo "   Tenant ID: $TENANT_ID"
echo ""

# Step 2: Get Dashboard Overview
echo "📊 Getting dashboard overview..."
DASHBOARD=$(curl -s $SERVER/api/admin/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json")

echo "$DASHBOARD" | jq '.'
echo ""

# Step 3: Get Tenant Details
echo "🏢 Getting tenant details..."
TENANT_DETAILS=$(curl -s $SERVER/api/admin/dashboard/tenant/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json")

echo "$TENANT_DETAILS" | jq '.'
```

---

## 6. Using JavaScript/TypeScript

```javascript
const SERVER = 'http://167.99.20.94:3001';
const ADMIN_KEY = 'Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4=';

// Login
async function login(email, password) {
  const response = await fetch(`${SERVER}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

// Get Dashboard (requires token + admin key)
async function getDashboard(token) {
  const response = await fetch(`${SERVER}/api/admin/dashboard/overview`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-admin-key': ADMIN_KEY,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Usage
const loginData = await login('ahad@basheer.com', '12345678');
const token = loginData.data.access_token;
const dashboard = await getDashboard(token);
console.log(dashboard);
```

---

## 7. Using Python

```python
import requests

SERVER = "http://167.99.20.94:3001"
ADMIN_KEY = "Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4="

# Login
def login(email, password):
    response = requests.post(
        f"{SERVER}/api/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()

# Get Dashboard
def get_dashboard(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json"
    }
    response = requests.get(
        f"{SERVER}/api/admin/dashboard/overview",
        headers=headers
    )
    return response.json()

# Usage
login_data = login("ahad@basheer.com", "12345678")
token = login_data["data"]["access_token"]
dashboard = get_dashboard(token)
print(dashboard)
```

---

## Available Endpoints

### ✅ Public Endpoints (No Auth Required)
- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/register-organization` - Register new organization

### 🔒 Dashboard Endpoints (Require Token + Admin Key)
- `GET /api/admin/dashboard/overview` - System overview
- `GET /api/admin/dashboard/tenants` - List all tenants
- `GET /api/admin/dashboard/tenant/:id` - Get tenant details
- `GET /api/admin/dashboard/alerts` - Get alerts
- `GET /api/admin/dashboard/metrics` - Get metrics
- `GET /api/admin/dashboard/growth` - Growth statistics

### 🔐 Super Admin Endpoints (Require Admin Key Only)
- `GET /api/admin/tenants` - List tenants
- `GET /api/admin/tenants/:id` - Get tenant
- `POST /api/admin/tenants/:id/suspend` - Suspend tenant
- `POST /api/admin/tenants/:id/activate` - Activate tenant
- `DELETE /api/admin/tenants/:id` - Delete tenant

---

## Your Database Connection

- **Host**: `167.99.20.94` (external) or `ent-tenant-db` (internal)
- **Port**: `5432`
- **Database**: `twenty_tenant_ahad-organization_157aebf3`
- **User**: `postgres`
- **Password**: (from your .env file)

**Connection String:**
```
postgresql://postgres:YOUR_PASSWORD@167.99.20.94:5432/twenty_tenant_ahad-organization_157aebf3
```

---

## Quick Reference

```bash
# Login
curl -X POST http://167.99.20.94:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahad@basheer.com", "password": "12345678"}'

# Dashboard (with token + admin key)
TOKEN="your_token"
curl http://167.99.20.94:3001/api/admin/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-admin-key: Gj2i6iyeyio2aTGT62ZUv57ka7H+7Xw+W697dvskgh4="

# Database access
ssh root@167.99.20.94 "docker exec -it ent-tenant-db psql -U postgres -d twenty_tenant_ahad-organization_157aebf3"
```

