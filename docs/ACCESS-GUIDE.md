# 🚀 Wosool AI SaaS - Access Guide

## Quick Access URLs

### 🌐 Main Services

#### **Twenty CRM Frontend** (Main Application)
- **URL**: `http://localhost:3000`
- **Description**: The main CRM interface where users can manage their data
- **Status**: Starting up (may take 1-2 minutes to fully initialize)
- **Note**: This is the primary interface for your SaaS platform

#### **Tenant Manager API** (Backend API)
- **URL**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Description**: Multi-tenant management API
- **Status**: ✅ Running and healthy

### 📊 Admin & Monitoring Tools

#### **Grafana** (Metrics Dashboard)
- **URL**: `http://localhost:3002`
- **Default Login**: 
  - Username: `admin`
  - Password: `admin` (or check `.env` for `GRAFANA_ADMIN_PASSWORD`)
- **Description**: Visualize system metrics and performance

#### **PgAdmin** (Database Management)
- **URL**: `http://localhost:5050`
- **Default Login**:
  - Email: `admin@wosool.ai` (or check `.env` for `PGADMIN_EMAIL`)
  - Password: `admin` (or check `.env` for `PGADMIN_PASSWORD`)
- **Description**: Manage PostgreSQL databases

#### **Redis Commander** (Redis Management)
- **URL**: `http://localhost:8081`
- **Description**: View and manage Redis cache/queues

#### **Prometheus** (Metrics Collection)
- **URL**: `http://localhost:9090` (internal only)`
- **Description**: Metrics collection endpoint

---

## 🔐 Authentication & API Usage

### 1. Register a New Tenant Organization

```bash
curl -X POST http://localhost:3001/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "My Company",
    "admin_email": "admin@mycompany.com",
    "admin_password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "tenant_id": "...",
    "slug": "my-company",
    "access_token": "eyJhbGc...",
    "user": {
      "id": "...",
      "email": "admin@mycompany.com",
      "role": "ADMIN"
    }
  }
}
```

### 2. Login to Existing Tenant

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "securepassword123"
  }'
```

### 3. Use Access Token for Authenticated Requests

```bash
TOKEN="your-access-token-here"

curl http://localhost:3001/api/admin/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Admin-Key: your-super-admin-key"
```

---

## 📡 API Endpoints

### Public Endpoints

- `GET /` - API information and available endpoints
- `GET /health` - Service health check
- `GET /metrics` - Prometheus metrics
- `POST /api/auth/register-organization` - Register new tenant
- `POST /api/auth/login` - Login to tenant

### Admin Endpoints (Require X-Admin-Key header)

- `GET /api/admin/tenants` - List all tenants
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/pools/stats` - Connection pool statistics

### Webhook Endpoints

- `POST /api/salla/webhook` - Salla integration webhooks
- `POST /api/clerk/webhook` - Clerk authentication webhooks

---

## 🗄️ Database Access

### Global Database (Tenant Registry)
```bash
docker exec -it wosool-global-db psql -U postgres -d twenty_global
```

### Tenant Database (Template)
```bash
docker exec -it wosool-tenant-db psql -U postgres -d twenty
```

### Specific Tenant Database
```bash
# List tenant databases
docker exec wosool-tenant-db psql -U postgres -c "\l" | grep twenty_tenant

# Connect to specific tenant
docker exec -it wosool-tenant-db psql -U postgres -d "twenty_tenant_test-company_2b82b32d"
```

---

## 🔧 Troubleshooting

### Port 80 Already in Use
If nginx can't start because port 80 is in use:
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop the service or change nginx port in docker-compose.yml
```

### Services Not Accessible
1. Check service status:
   ```bash
   docker compose ps
   ```

2. Check service logs:
   ```bash
   docker compose logs [service-name]
   ```

3. Verify health:
   ```bash
   curl http://localhost:3001/health
   ```

### Twenty CRM Not Loading
- Wait 1-2 minutes for full initialization
- Check logs: `docker compose logs twenty-crm`
- Verify database connection

---

## 📝 Environment Variables

Key environment variables in `.env`:
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - JWT token secret
- `SUPER_ADMIN_KEY` - Admin API key
- `SOURCE_DATABASE_NAME` - Template database name (default: `twenty`)

---

## 🎯 Next Steps

1. **Access Twenty CRM**: Open `http://localhost:3000` in your browser
2. **Create Your First Tenant**: Use the registration API
3. **Set Up Monitoring**: Access Grafana at `http://localhost:3002`
4. **Manage Databases**: Use PgAdmin at `http://localhost:5050`

---

## 📚 Additional Resources

- API Documentation: `http://localhost:3001/`
- Health Status: `http://localhost:3001/health`
- Metrics: `http://localhost:3001/metrics`
