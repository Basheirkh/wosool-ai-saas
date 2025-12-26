# Wosool AI SaaS - Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## 🎯 Overview

This guide provides step-by-step instructions for deploying the Wosool AI SaaS platform in both development and production environments. The platform uses a **forked Twenty CRM repository** with custom Docker images built from source.

### Architecture Highlights

- **Custom Twenty CRM**: Built from forked repository (not official Docker image)
- **Multi-tenant**: Database-per-tenant architecture
- **Microservices**: Tenant Manager, Salla Orchestrator, Twenty CRM
- **Infrastructure**: PostgreSQL, Redis, Nginx, Prometheus, Grafana

---

## ✅ Prerequisites

### System Requirements

**Minimum (Development):**
- 4 CPU cores
- 8GB RAM
- 50GB disk space
- Ubuntu 20.04+ or similar Linux distribution

**Recommended (Production):**
- 8+ CPU cores
- 16GB+ RAM
- 100GB+ SSD storage
- Ubuntu 22.04 LTS

### Software Requirements

```bash
# Docker
Docker Engine 20.10+
Docker Compose 2.0+

# Development Tools (optional)
Node.js 18+
Git
```

### External Services

1. **Clerk Account** (https://clerk.com)
   - Create application
   - Get publishable key, secret key, and webhook secret

2. **Salla Developer Account** (https://salla.dev)
   - Register application
   - Get client ID, client secret
   - Configure OAuth redirect URI

3. **Domain & SSL** (Production)
   - Domain name (e.g., wosool.ai)
   - SSL certificate (Let's Encrypt recommended)

---

## 🚀 Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/Basheirkh/wosool-ai-saas.git
cd wosool-ai-saas

# Initialize submodules (Twenty CRM fork)
git submodule update --init --recursive
```

### Step 2: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Minimum Required Variables:**

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Application Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here
APP_SECRET=your_app_secret_here
SUPER_ADMIN_KEY=your_super_admin_key_here

# Clerk (get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Salla (get from https://salla.dev)
SALLA_CLIENT_ID=your_client_id
SALLA_CLIENT_SECRET=your_client_secret
SALLA_WEBHOOK_SECRET=your_webhook_secret

# URLs (for local development)
APP_URL=http://localhost
CRM_BASE_URL=localhost
REACT_APP_SERVER_BASE_URL=http://localhost:3000
```

### Step 3: Build Custom Twenty CRM Image

```bash
# Build the custom Twenty CRM Docker image from forked repo
./build-twenty-crm.sh

# This will take 10-20 minutes on first build
# The image is built from the forked repository with custom Dockerfile
```

### Step 4: Start the Services

```bash
# Start all services in detached mode
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check system health
curl http://localhost/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-12-25T12:00:00.000Z"}

# Access services:
# - Main API: http://localhost/api
# - Grafana: http://localhost:3002 (admin/admin)
# - PgAdmin: http://localhost:5050
# - Redis Commander: http://localhost:8081
```

### Step 6: Initialize Database

```bash
# The databases are automatically initialized on first startup
# Check Twenty CRM logs to verify migration completion
docker-compose logs twenty-crm | grep -i migration

# If you need to run migrations manually:
docker-compose exec twenty-crm yarn database:migrate:prod
```

---

## 🏭 Production Deployment

### Infrastructure Setup

#### Option A: Single Server (Small Scale)

**Recommended Specs:**
- 8 vCPU
- 16GB RAM
- 100GB SSD
- Ubuntu 22.04 LTS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Option B: Cloud Deployment (Scalable)

**AWS Example:**
- EC2: t3.xlarge or larger
- RDS: PostgreSQL 15 (Multi-AZ)
- ElastiCache: Redis cluster
- ALB: Application Load Balancer
- Route 53: DNS management
- ACM: SSL certificates

**Google Cloud Example:**
- Compute Engine: n2-standard-4 or larger
- Cloud SQL: PostgreSQL 15 (HA)
- Memorystore: Redis instance
- Cloud Load Balancing
- Cloud DNS
- Managed SSL certificates

### Production Configuration

#### 1. Environment Variables

```bash
# Production .env
NODE_ENV=production
LOG_LEVEL=info

# Database (use managed database in production)
POSTGRES_PASSWORD=very_secure_production_password
# For managed DB:
# GLOBAL_DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/twenty_global
# PG_DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/twenty_tenant_template

# Redis (use managed Redis in production)
# REDIS_URL=redis://elasticache-endpoint:6379

# Application URLs (use your actual domains)
APP_URL=https://wosool.ai
CRM_BASE_URL=api.wosool.ai
REACT_APP_SERVER_BASE_URL=https://api.wosool.ai
TWENTY_BASE_URL=https://api.wosool.ai/metadata

# SSL/TLS
ENABLE_SSL=true
SSL_CERT_PATH=/etc/ssl/certs/fullchain.pem
SSL_KEY_PATH=/etc/ssl/private/privkey.pem
```

#### 2. SSL/TLS Setup

**Using Let's Encrypt:**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot certonly --standalone -d wosool.ai -d api.wosool.ai

# Certificates will be saved to:
# /etc/letsencrypt/live/wosool.ai/fullchain.pem
# /etc/letsencrypt/live/wosool.ai/privkey.pem

# Update docker-compose.yml to mount certificates
# Add to nginx service:
volumes:
  - /etc/letsencrypt/live/wosool.ai/fullchain.pem:/etc/ssl/certs/fullchain.pem:ro
  - /etc/letsencrypt/live/wosool.ai/privkey.pem:/etc/ssl/private/privkey.pem:ro
```

#### 3. Nginx Configuration for Production

Update `nginx/conf.d/wosool.conf`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name wosool.ai api.wosool.ai;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name wosool.ai api.wosool.ai;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration
}
```

#### 4. Build and Deploy

```bash
# Clone repository on production server
git clone https://github.com/Basheirkh/wosool-ai-saas.git
cd wosool-ai-saas

# Initialize submodules
git submodule update --init --recursive

# Configure environment
cp .env.example .env
nano .env  # Fill in production values

# Build custom Twenty CRM image
./build-twenty-crm.sh production

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### 5. Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

---

## ⚙️ Configuration

### Database Configuration

#### Connection Pooling

The Tenant Manager uses connection pooling for optimal performance:

```typescript
// Default pool settings (can be configured via environment)
{
  max: 20,              // Maximum connections per tenant
  min: 2,               // Minimum connections per tenant
  idle: 10000,          // Idle timeout (10 seconds)
  acquire: 30000,       // Acquisition timeout (30 seconds)
  evict: 1000           // Eviction interval (1 second)
}
```

#### Database Migrations

```bash
# Automatic migrations (default)
DISABLE_DB_MIGRATIONS=false

# Manual migrations
DISABLE_DB_MIGRATIONS=true
docker-compose exec twenty-crm yarn database:migrate:prod
```

### Redis Configuration

```bash
# Redis memory limit
REDIS_MAXMEMORY=2gb

# Eviction policy
REDIS_MAXMEMORY_POLICY=allkeys-lru

# Persistence
REDIS_APPENDONLY=yes
```

### Monitoring Configuration

#### Prometheus

Edit `monitoring/prometheus.yml` to add custom scrape targets:

```yaml
scrape_configs:
  - job_name: 'tenant-manager'
    static_configs:
      - targets: ['tenant-manager:3001']
  
  - job_name: 'twenty-crm'
    static_configs:
      - targets: ['twenty-crm:3000']
```

#### Grafana

Access: `http://localhost:3002` (default: admin/admin)

**Pre-configured Dashboards:**
- System Overview
- Tenant Metrics
- Database Performance
- API Request Rates

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Twenty CRM Not Starting

**Symptoms:**
- Container exits immediately
- 502 Bad Gateway from Nginx

**Solutions:**

```bash
# Check logs
docker-compose logs twenty-crm

# Verify database connection
docker-compose exec twenty-crm psql $PG_DATABASE_URL -c "SELECT 1"

# Check working directory
docker-compose exec twenty-crm pwd
# Should output: /app/packages/twenty-server

# Verify port binding
docker-compose exec twenty-crm ss -tlnp | grep 3000

# Restart with fresh logs
docker-compose restart twenty-crm
docker-compose logs -f twenty-crm
```

#### 2. Database Connection Errors

```bash
# Check database status
docker-compose ps global-db tenant-db

# Test connection
docker-compose exec global-db pg_isready -U postgres

# Check credentials
docker-compose exec global-db psql -U postgres -c "\l"
```

#### 3. Build Failures

```bash
# Clean build cache
docker system prune -a --volumes

# Rebuild from scratch
./build-twenty-crm.sh

# Check disk space
df -h
```

#### 4. Port Conflicts

```bash
# Check what's using ports
sudo netstat -tlnp | grep -E ':(80|443|3000|3001|5432|6379)'

# Stop conflicting services
sudo systemctl stop nginx  # If system nginx is running
```

### Debug Mode

Enable debug logging:

```bash
# In .env
NODE_ENV=development
LOG_LEVEL=debug

# Restart services
docker-compose restart
```

---

## 🔄 Maintenance

### Backup Strategy

#### Database Backups

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup global database
docker-compose exec -T global-db pg_dump -U postgres twenty_global > \
  $BACKUP_DIR/global_db_$DATE.sql

# Backup tenant databases
docker-compose exec -T tenant-db pg_dumpall -U postgres > \
  $BACKUP_DIR/tenant_dbs_$DATE.sql

# Compress backups
gzip $BACKUP_DIR/*.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

#### Volume Backups

```bash
# Backup Docker volumes
docker run --rm \
  -v wosool-ai-saas_global-db-data:/data \
  -v /backups:/backup \
  alpine tar czf /backup/global-db-data-$(date +%Y%m%d).tar.gz /data
```

### Updates and Upgrades

#### Updating Services

```bash
# Pull latest changes
git pull origin master
git submodule update --remote --merge

# Rebuild images
./build-twenty-crm.sh

# Restart services with new images
docker-compose up -d --build
```

#### Updating Twenty CRM Fork

```bash
cd twenty-crm-forked

# Fetch upstream changes
git fetch upstream

# Merge upstream changes
git merge upstream/main

# Resolve conflicts if any
# Then push to your fork
git push origin main
```

### Monitoring and Alerts

#### Health Checks

```bash
# Create health check script
#!/bin/bash
ENDPOINTS=(
  "http://localhost/api/health"
  "http://localhost:3001/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  if ! curl -f -s $endpoint > /dev/null; then
    echo "ALERT: $endpoint is down"
    # Send alert (email, Slack, etc.)
  fi
done
```

#### Log Rotation

```bash
# Docker logs are automatically rotated
# Configure in docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Performance Tuning

#### Database Optimization

```sql
-- Run on tenant databases periodically
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

#### Redis Optimization

```bash
# Monitor Redis memory
docker-compose exec redis redis-cli INFO memory

# Check slow queries
docker-compose exec redis redis-cli SLOWLOG GET 10
```

---

## 📞 Support

For issues and questions:

- **GitHub Issues**: https://github.com/Basheirkh/wosool-ai-saas/issues
- **Documentation**: See README.md and other docs in the repository
- **Email**: support@wosool.ai

---

## 📄 License

This project is licensed under the MIT License.
