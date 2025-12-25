# Multi-Tenant Manager Service

Professional multi-tenant architecture implementation for Twenty CRM SaaS platform.

## Architecture Overview

This service provides complete tenant isolation through:
- **Separate databases per tenant** - Physical data isolation
- **Dynamic connection pooling** - Efficient resource management
- **JWT-based tenant resolution** - Secure tenant context
- **Automated provisioning** - Self-service tenant creation

## Components

### 1. Tenant Registry
- Global database storing tenant metadata
- Connection strings and configuration
- Status management (active, suspended, pending)

### 2. Tenant Provisioning
- Automated database creation
- Schema migration per tenant
- Initial data seeding

### 3. Connection Management
- Dynamic pool creation per tenant
- Automatic cleanup of idle pools
- Connection limit enforcement

### 4. Authentication & Authorization
- Multi-tenant JWT tokens
- Tenant context resolution
- Role-based access control

## Directory Structure

```
tenant-manager/
├── src/
│   ├── database/
│   │   ├── global/
│   │   │   └── schema.sql          # Tenant registry schema
│   │   └── migrations/             # Tenant database migrations
│   ├── services/
│   │   ├── tenant-provisioning.ts  # Tenant creation service
│   │   ├── connection-pool.ts      # Connection pool manager
│   │   └── tenant-resolver.ts      # Tenant context resolver
│   ├── middleware/
│   │   └── tenant-middleware.ts    # Express middleware
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.ts         # Tenant registration
│   │   │   └── login.ts            # Multi-tenant login
│   │   └── admin/
│   │       └── tenants.ts          # Admin endpoints
│   └── utils/
│       └── tenant-context.ts       # Tenant context management
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Environment Variables

```env
# Global Database (Tenant Registry)
GLOBAL_DATABASE_URL=postgresql://postgres:password@global-db:5432/twenty_global

# PostgreSQL Admin (for creating tenant databases)
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=password
POSTGRES_HOST=postgres-server

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Connection Pooling
MAX_CONNECTIONS_PER_TENANT=10
POOL_IDLE_TIMEOUT=1800000  # 30 minutes
MAX_TOTAL_CONNECTIONS=10000

# Multi-tenancy
ENABLE_MULTI_TENANCY=true
TENANT_DB_PREFIX=twenty_tenant_
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/register-organization` - Register new tenant
- `POST /api/auth/login` - Multi-tenant login
- `POST /api/auth/refresh` - Refresh token

### Authenticated Endpoints (Tenant-scoped)
- `GET /api/me` - Current user info
- `GET /api/people` - Tenant's people
- `GET /api/opportunities` - Tenant's opportunities
- All other Twenty CRM endpoints (automatically tenant-scoped)

### Admin Endpoints (Global)
- `GET /api/admin/tenants` - List all tenants
- `GET /api/admin/tenants/:id` - Get tenant details
- `POST /api/admin/tenants/:id/suspend` - Suspend tenant
- `DELETE /api/admin/tenants/:id` - Delete tenant (GDPR)

## Usage

### Starting the Service

```bash
docker-compose up tenant-manager
```

### Creating a Tenant

```bash
curl -X POST http://localhost:3000/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "ACME Corp",
    "admin_email": "admin@acme.com",
    "admin_password": "secure_password",
    "plan": "pro"
  }'
```

### Login (Tenant Resolution)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "secure_password"
  }'
```

## Security

- **Data Isolation**: Complete physical separation via separate databases
- **Connection Isolation**: Dedicated pools per tenant
- **JWT Security**: Tenant ID embedded in token, verified on every request
- **GDPR Compliance**: Complete data deletion on tenant removal

## Performance

- **Connection Pooling**: Reuses connections efficiently
- **Lazy Pool Creation**: Pools created on first request
- **Automatic Cleanup**: Idle pools destroyed after 30 minutes
- **Horizontal Scaling**: Stateless design allows multiple instances

