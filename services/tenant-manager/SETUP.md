# Multi-Tenant Manager - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **npm** or **pnpm**
4. **PostgreSQL client tools** (`psql`, `pg_dump`) - usually included with PostgreSQL

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file and edit it with your settings:

```bash
cp .env.example .env
```

Edit `.env` and configure the following **required** variables:

```env
# Global Database - This will store tenant registry
GLOBAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/twenty_global

# PostgreSQL Admin Credentials
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Source Database - The database whose schema will be copied to new tenants
SOURCE_DATABASE_NAME=twenty

# JWT Secret - MUST be changed in production
JWT_SECRET=your-strong-random-secret-here

# Super Admin Key - MUST be changed in production
SUPER_ADMIN_KEY=your-strong-admin-key-here
```

### 3. Create Required Databases

Create the global database and source database in PostgreSQL:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create global database (for tenant registry)
CREATE DATABASE twenty_global;

# Create source database (template for tenant schemas)
CREATE DATABASE twenty;

# Exit psql
\q
```

**Note**: The `twenty` database should contain the schema you want to copy to each tenant. If you're using Twenty CRM, this should be your main Twenty database with the complete schema.

### 4. Build the Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 5. Start the Service

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 6. Verify Installation

Check the health endpoint:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "tenant-manager",
  "timestamp": "2024-12-24T05:00:00.000Z"
}
```

## Usage

### Register a New Tenant

```bash
curl -X POST http://localhost:3001/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "ACME Corp",
    "admin_email": "admin@acme.com",
    "admin_password": "SecurePassword123!",
    "plan": "pro"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "tenant_id": "uuid-here",
    "slug": "acme-corp",
    "access_token": "jwt-token-here",
    "user": {
      "id": "user-uuid",
      "email": "admin@acme.com",
      "role": "ADMIN"
    }
  }
}
```

### Login to Tenant

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePassword123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token-here",
    "tenant_id": "uuid-here",
    "database_url": "postgresql://...",
    "user": {
      "id": "user-uuid",
      "email": "admin@acme.com",
      "role": "ADMIN",
      "tenant_id": "uuid-here"
    }
  }
}
```

### List All Tenants (Admin)

```bash
curl -X GET http://localhost:3001/api/admin/tenants \
  -H "X-Admin-Key: your-super-admin-key"
```

### Get System Statistics (Admin)

```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "X-Admin-Key: your-super-admin-key"
```

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `GLOBAL_DATABASE_URL` | **Yes** | - | Global tenant registry database |
| `POSTGRES_ADMIN_USER` | **Yes** | `postgres` | PostgreSQL admin username |
| `POSTGRES_ADMIN_PASSWORD` | **Yes** | - | PostgreSQL admin password |
| `POSTGRES_HOST` | **Yes** | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | No | `5432` | PostgreSQL port |
| `SOURCE_DATABASE_NAME` | No | `twenty` | Source database for schema copy |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `24h` | JWT expiration time |
| `SUPER_ADMIN_KEY` | **Yes** | - | Admin API key |
| `TENANT_DB_PREFIX` | No | `twenty_tenant_` | Prefix for tenant databases |
| `MAX_CONNECTIONS_PER_TENANT` | No | `10` | Max connections per tenant pool |
| `MAX_TOTAL_CONNECTIONS` | No | `10000` | Max total connections |
| `POOL_IDLE_TIMEOUT` | No | `1800000` | Pool idle timeout (ms) |
| `USE_DOCKER_FOR_SCHEMA_COPY` | No | `false` | Use Docker for pg_dump |
| `DOCKER_POSTGRES_CONTAINER` | No | `twenty-db` | Docker container name |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |

### Using Docker for Schema Copy

If your PostgreSQL is running in Docker and you want to use `docker exec` for schema copying:

```env
USE_DOCKER_FOR_SCHEMA_COPY=true
DOCKER_POSTGRES_CONTAINER=your-postgres-container-name
```

Otherwise, the service will use local `pg_dump` command (recommended for most setups).

## Troubleshooting

### Error: "Source database 'twenty' does not exist"

**Solution**: Create the source database or change `SOURCE_DATABASE_NAME` to an existing database:

```bash
psql -U postgres -c "CREATE DATABASE twenty;"
```

### Error: "Global database validation failed"

**Solution**: The global database schema is not initialized. This should happen automatically on startup, but you can manually run:

```bash
npm run migrate:global
```

### Error: "pg_dump: command not found"

**Solution**: Install PostgreSQL client tools:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Or use Docker mode
USE_DOCKER_FOR_SCHEMA_COPY=true
```

### Error: "Failed to create database"

**Solution**: Check PostgreSQL credentials and permissions:

```bash
# Test connection
psql -h localhost -U postgres -c "SELECT 1"

# Grant necessary permissions
psql -U postgres -c "ALTER USER postgres CREATEDB;"
```

### Slow Tenant Provisioning

**Causes**:
- Large source database schema
- Network latency to PostgreSQL
- Insufficient PostgreSQL resources

**Solutions**:
- Optimize source database schema
- Use local PostgreSQL instead of remote
- Increase PostgreSQL connection limits
- Use faster storage (SSD)

### Port Already in Use

**Solution**: Change the port in `.env`:

```env
PORT=3002
```

## Security Best Practices

### Production Deployment

1. **Change Default Secrets**:
   ```env
   JWT_SECRET=$(openssl rand -base64 32)
   SUPER_ADMIN_KEY=$(openssl rand -base64 32)
   ```

2. **Use Strong Database Passwords**:
   ```env
   POSTGRES_ADMIN_PASSWORD=$(openssl rand -base64 24)
   ```

3. **Enable HTTPS**: Use a reverse proxy (nginx, Caddy) with SSL/TLS

4. **Restrict CORS**:
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

5. **Use Environment-Specific Configs**: Never commit `.env` to version control

6. **Enable Rate Limiting**: Already configured in the application

7. **Regular Backups**: Backup both global database and tenant databases

8. **Monitor Logs**: Set up logging and monitoring for production

## Architecture

### Database Structure

```
┌─────────────────────────────────────┐
│   Global Database (twenty_global)   │
│  - tenant_registry                  │
│  - global_users                     │
│  - tenant_settings                  │
│  - tenant_usage                     │
└─────────────────────────────────────┘
              │
              │ manages
              ▼
┌─────────────────────────────────────┐
│  Tenant Databases (isolated)        │
│  - twenty_tenant_acme_12345678      │
│  - twenty_tenant_widgets_87654321   │
│  - twenty_tenant_...                │
└─────────────────────────────────────┘
```

### Request Flow

1. User registers → Creates tenant database → Returns JWT
2. User logs in → Validates credentials → Returns JWT with tenant_id
3. User makes API request → JWT verified → Tenant resolved → Tenant database accessed

## API Reference

See [README.md](./README.md) for complete API documentation.

## Support

For issues, questions, or contributions, please refer to the project repository.
