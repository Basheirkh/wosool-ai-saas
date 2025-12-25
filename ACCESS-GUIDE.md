# Access Guide for Your Organization

## Your Organization Details

- **Tenant ID**: `a070d84e-5690-48fc-b5f9-c705a9343b72`
- **Slug**: `ahad-organization`
- **Admin Email**: `ahad@basheer.com`
- **Server IP**: `167.99.20.94`
- **Port**: `3001`

## Access Token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MzMzNjU5Ni04YzkzLTQ5YzYtOWExYS0wMjAwNzY3NTFmNzgiLCJlbWFpbCI6ImFoYWRAYmFzaGVlci5jb20iLCJ0ZW5hbnRfaWQiOiJhMDcwZDg0ZS01NjkwLTQ4ZmMtYjVmOS1jNzA1YTkzNDNiNzIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjY1Nzk5MTgsImV4cCI6MTc2NjY2NjMxOH0.zf1GoxP8wzTUqhaFzXQFwojQXLK5MM4c6IPct6EXL_s
```

## How to Access

### 1. Direct API Access (Using cURL)

#### Health Check
```bash
curl http://167.99.20.94:3001/health
```

#### Login (Get New Token)
```bash
curl -X POST http://167.99.20.94:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahad@basheer.com",
    "password": "12345678"
  }'
```

#### Access Protected Endpoints
```bash
# Replace YOUR_TOKEN with the access token above
curl http://167.99.20.94:3001/api/admin/dashboard/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Using Postman or Similar Tools

1. **Base URL**: `http://167.99.20.94:3001`
2. **Authentication**: 
   - Type: Bearer Token
   - Token: Use the access token provided above

### 3. Available API Endpoints

#### Authentication Endpoints
- `POST /api/auth/register-organization` - Register new organization
- `POST /api/auth/login` - Login and get access token

#### Admin Dashboard Endpoints (Requires Authentication)
- `GET /api/admin/dashboard/overview` - Get dashboard overview
- `GET /api/admin/dashboard/tenants` - List all tenants
- `GET /api/admin/dashboard/tenant/:id` - Get specific tenant details
- `GET /api/admin/dashboard/alerts` - Get system alerts
- `GET /api/admin/dashboard/metrics` - Get system metrics
- `GET /api/admin/dashboard/growth` - Get growth statistics

#### Super Admin Endpoints (Requires SUPER_ADMIN_KEY)
- `GET /api/admin/tenants` - List all tenants (super admin)
- `GET /api/admin/tenants/:id` - Get tenant details (super admin)
- `POST /api/admin/tenants/:id/suspend` - Suspend tenant
- `POST /api/admin/tenants/:id/activate` - Activate tenant
- `DELETE /api/admin/tenants/:id` - Delete tenant
- `GET /api/admin/stats` - Get system statistics

#### Salla Webhooks
- `POST /api/salla/webhooks` - Salla webhook endpoint
- `GET /api/salla/webhooks` - Webhook status

### 4. Example: Access Your Dashboard

```bash
# Set your token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MzMzNjU5Ni04YzkzLTQ5YzYtOWExYS0wMjAwNzY3NTFmNzgiLCJlbWFpbCI6ImFoYWRAYmFzaGVlci5jb20iLCJ0ZW5hbnRfaWQiOiJhMDcwZDg0ZS01NjkwLTQ4ZmMtYjVmOS1jNzA1YTkzNDNiNzIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjY1Nzk5MTgsImV4cCI6MTc2NjY2NjMxOH0.zf1GoxP8wzTUqhaFzXQFwojQXLK5MM4c6IPct6EXL_s"

# Get dashboard overview
curl http://167.99.20.94:3001/api/admin/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 5. Using JavaScript/TypeScript

```javascript
const token = 'YOUR_ACCESS_TOKEN';
const baseUrl = 'http://167.99.20.94:3001';

// Fetch dashboard data
fetch(`${baseUrl}/api/admin/dashboard/overview`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Error:', err));
```

### 6. Using Python

```python
import requests

token = "YOUR_ACCESS_TOKEN"
base_url = "http://167.99.20.94:3001"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Get dashboard overview
response = requests.get(
    f"{base_url}/api/admin/dashboard/overview",
    headers=headers
)

print(response.json())
```

## Important Notes

1. **Token Expiration**: The access token has an expiration time. If it expires, use the login endpoint to get a new token.

2. **HTTPS**: For production, configure SSL/TLS certificates and use HTTPS instead of HTTP.

3. **Nginx Configuration**: If you have Nginx configured, you can access through port 80/443 instead of 3001.

4. **Database Access**: Your tenant database is isolated and can be accessed through:
   - Database Name: `twenty_tenant_ahad-organization_<uuid>`
   - Host: `ent-tenant-db` (internal) or `167.99.20.94` (external)
   - Port: `5432`
   - User: `postgres`
   - Password: (from your .env file)

## Next Steps

1. **Test the API**: Use the examples above to test your access
2. **Configure Frontend**: Connect your frontend application to these endpoints
3. **Set Up Monitoring**: Access Grafana at `http://167.99.20.94:3000` (if configured)
4. **Database Management**: Access PgAdmin at `http://167.99.20.94:5050` (if configured)

## Troubleshooting

If you get authentication errors:
1. Check that the token is correctly formatted in the Authorization header
2. Verify the token hasn't expired (use login endpoint to get a new one)
3. Ensure the server is running: `curl http://167.99.20.94:3001/health`

If you get connection errors:
1. Check that the server is accessible: `ping 167.99.20.94`
2. Verify the port is open: `telnet 167.99.20.94 3001`
3. Check Docker containers: `docker ps` on the server

