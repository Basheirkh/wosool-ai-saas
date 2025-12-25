# Enterprise Tenant Manager - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the enterprise tenant manager to production with high availability, monitoring, and security.

---

## 📋 Prerequisites

### Infrastructure Requirements

- **Compute**: 2+ servers (4 CPU, 8GB RAM each)
- **Database**: PostgreSQL 14+ (dedicated server recommended)
- **Cache**: Redis 6+ (dedicated server recommended)
- **Load Balancer**: Nginx or cloud load balancer
- **Storage**: 100GB+ SSD storage
- **Network**: Low-latency network between services

### Software Requirements

- Docker 20+ and Docker Compose 2+
- Node.js 18+ (for CLI tools)
- PostgreSQL client tools
- SSL certificates (Let's Encrypt recommended)

---

## 🏗️ Architecture Overview

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼──────┐
│ Tenant Mgr 1 │  │ Tenant Mgr 2  │  │ Tenant Mgr N │
└───────┬──────┘  └────────┬──────┘  └───────┬──────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼──────┐
│  PostgreSQL  │  │     Redis     │  │  Prometheus  │
│   (Global)   │  │ (Cache+Queue) │  │   (Metrics)  │
└──────────────┘  └───────────────┘  └──────────────┘
```

---

## 📦 Deployment Options

### Option 1: Docker Compose (Recommended for < 1000 tenants)

**Pros**: Easy setup, all-in-one deployment
**Cons**: Single host limitation

```bash
# 1. Clone repository
git clone <repo-url>
cd tenant-manager-enterprise

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Start services
docker-compose -f docker-compose.enterprise.yml up -d

# 4. Initialize database
docker-compose exec tenant-manager-1 npm run migrate:global

# 5. Verify
curl http://localhost/health
```

### Option 2: Kubernetes (Recommended for 1000+ tenants)

**Pros**: Auto-scaling, high availability, multi-region
**Cons**: More complex setup

```bash
# 1. Create namespace
kubectl create namespace tenant-manager

# 2. Create secrets
kubectl create secret generic tenant-secrets \
  --from-env-file=.env \
  -n tenant-manager

# 3. Deploy
kubectl apply -f k8s/ -n tenant-manager

# 4. Verify
kubectl get pods -n tenant-manager
```

### Option 3: Cloud-Native (AWS/GCP/Azure)

**Pros**: Managed services, easy scaling
**Cons**: Vendor lock-in, higher cost

See cloud-specific guides:
- [AWS Deployment](./docs/AWS_DEPLOYMENT.md)
- [GCP Deployment](./docs/GCP_DEPLOYMENT.md)
- [Azure Deployment](./docs/AZURE_DEPLOYMENT.md)

---

## ⚙️ Configuration

### 1. Environment Variables

Create `.env` file with required configuration:

```env
# === Core Configuration ===
NODE_ENV=production
PORT=3001

# === Database ===
GLOBAL_DATABASE_URL=postgresql://user:pass@db-host:5432/twenty_global
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=<strong-password>
POSTGRES_HOST=db-host
POSTGRES_PORT=5432

# === Redis ===
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=<strong-password>

# === Security ===
JWT_SECRET=<generate-with-openssl-rand-base64-32>
SUPER_ADMIN_KEY=<generate-with-openssl-rand-base64-32>

# === Features ===
ENABLE_ASYNC_PROVISIONING=true
ENABLE_METRICS=true
ENABLE_RATE_LIMITING=true
ENABLE_QUOTAS=true

# === Scaling ===
MAX_CONNECTIONS_PER_TENANT=20
MAX_TOTAL_CONNECTIONS=10000
POOL_IDLE_TIMEOUT=1800000

# === Monitoring ===
METRICS_PORT=9090
LOG_LEVEL=info

# === Optional: Multi-Region ===
REGION=us-east-1
ENABLE_MULTI_REGION=false
```

### 2. Generate Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Admin Key
openssl rand -base64 32

# Database Password
openssl rand -base64 24
```

### 3. SSL Certificates

#### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d api.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

#### Using Cloud Provider

- AWS: Use ACM (AWS Certificate Manager)
- GCP: Use Google-managed SSL
- Azure: Use Azure Key Vault

---

## 🚀 Deployment Steps

### Step 1: Prepare Infrastructure

```bash
# 1. Provision servers
# - 2x Application servers (4 CPU, 8GB RAM)
# - 1x Database server (8 CPU, 16GB RAM)
# - 1x Redis server (2 CPU, 4GB RAM)

# 2. Install Docker on application servers
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Install PostgreSQL on database server
sudo apt-get install postgresql-14

# 4. Install Redis on cache server
sudo apt-get install redis-server
```

### Step 2: Configure Database

```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create global database
CREATE DATABASE twenty_global;

# 3. Create admin user
CREATE USER tenant_admin WITH PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE twenty_global TO tenant_admin;

# 4. Configure PostgreSQL for high connections
# Edit /etc/postgresql/14/main/postgresql.conf
max_connections = 5000
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2MB
min_wal_size = 1GB
max_wal_size = 4GB

# 5. Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Configure Redis

```bash
# 1. Edit /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
requirepass <strong-password>

# 2. Restart Redis
sudo systemctl restart redis
```

### Step 4: Deploy Application

```bash
# 1. Clone on each application server
git clone <repo-url> /opt/tenant-manager
cd /opt/tenant-manager

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Build and start
docker-compose -f docker-compose.enterprise.yml up -d

# 4. Initialize database (run once)
docker-compose exec tenant-manager-1 npm run migrate:global

# 5. Verify
docker-compose ps
curl http://localhost:3001/health
```

### Step 5: Configure Load Balancer

```bash
# 1. Install Nginx on load balancer server
sudo apt-get install nginx

# 2. Copy configuration
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# 3. Update upstream servers
sudo nano /etc/nginx/nginx.conf
# Update IPs: server app1:3001; server app2:3001;

# 4. Test configuration
sudo nginx -t

# 5. Start Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 6: Configure Monitoring

```bash
# 1. Access Grafana
http://your-domain:3000
# Login: admin / <GRAFANA_ADMIN_PASSWORD>

# 2. Add Prometheus data source
# URL: http://prometheus:9090

# 3. Import dashboards
# Upload ./monitoring/grafana-dashboards/*.json

# 4. Configure alerts
# Set up email/Slack notifications
```

---

## 🔒 Security Hardening

### 1. Firewall Rules

```bash
# Application servers
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Database server
sudo ufw allow from <app-server-ip> to any port 5432
sudo ufw enable

# Redis server
sudo ufw allow from <app-server-ip> to any port 6379
sudo ufw enable
```

### 2. PostgreSQL Security

```bash
# Edit /etc/postgresql/14/main/pg_hba.conf
# Allow only specific IPs
host    all    all    <app-server-1-ip>/32    md5
host    all    all    <app-server-2-ip>/32    md5

# Restart
sudo systemctl restart postgresql
```

### 3. Redis Security

```bash
# Edit /etc/redis/redis.conf
bind <private-ip>
requirepass <strong-password>
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""

# Restart
sudo systemctl restart redis
```

### 4. Application Security

```env
# .env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Monitoring Setup

### 1. Prometheus

Access: `http://your-domain:9092`

**Key Metrics to Monitor**:
- `active_tenants` - Number of active tenants
- `api_requests_total` - Total API requests
- `api_response_time_seconds` - Response time
- `database_connections_total` - DB connections
- `cache_hit_rate` - Cache performance

### 2. Grafana

Access: `http://your-domain:3000`

**Dashboards**:
- System Overview
- Tenant Metrics
- Performance Metrics
- Resource Usage
- Alerts

### 3. Alerts

Configure alerts for:
- High error rate (> 5%)
- Slow response time (> 2s)
- High CPU usage (> 80%)
- High memory usage (> 90%)
- Database connection pool exhausted
- Cache hit rate low (< 80%)
- Tenant quota exceeded

---

## 🔄 Backup Strategy

### 1. Database Backups

```bash
# Automated daily backups
cat > /opt/backup-script.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres twenty_global | gzip > /backups/global_$DATE.sql.gz
find /backups -name "global_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup-script.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /opt/backup-script.sh
```

### 2. Redis Backups

```bash
# Redis automatically saves to disk (AOF enabled)
# Copy RDB file periodically
cp /var/lib/redis/dump.rdb /backups/redis_$(date +%Y%m%d).rdb
```

### 3. Tenant Database Backups

```bash
# Use tenant-cli
tenant-cli backup --all --destination /backups/tenants/
```

---

## 📈 Scaling Guide

### Horizontal Scaling

1. **Add more application servers**:
   ```bash
   # Deploy to new server
   docker-compose up -d
   
   # Add to load balancer
   # Update nginx upstream configuration
   ```

2. **Database read replicas**:
   ```bash
   # Set up PostgreSQL streaming replication
   # Configure read-only connections
   ```

3. **Redis cluster**:
   ```bash
   # Set up Redis Cluster for high availability
   # Update REDIS_URL to cluster endpoints
   ```

### Vertical Scaling

1. **Increase server resources**:
   - CPU: 4 → 8 cores
   - RAM: 8GB → 16GB
   - Storage: SSD with high IOPS

2. **Tune database**:
   ```sql
   -- Increase connections
   ALTER SYSTEM SET max_connections = 10000;
   
   -- Increase shared buffers
   ALTER SYSTEM SET shared_buffers = '8GB';
   ```

---

## 🧪 Testing

### Health Check

```bash
curl http://your-domain/health
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load-test.js
```

### Smoke Tests

```bash
# Register tenant
curl -X POST http://your-domain/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{"organization_name":"Test","admin_email":"test@test.com","admin_password":"Test123!"}'

# Login
curl -X POST http://your-domain/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

## 🆘 Troubleshooting

### Common Issues

1. **High response times**
   - Check cache hit rate
   - Increase Redis memory
   - Add more application servers

2. **Database connection errors**
   - Increase max_connections
   - Check connection pool settings
   - Review slow queries

3. **Memory issues**
   - Increase server RAM
   - Tune connection pool sizes
   - Enable swap (not recommended for production)

### Logs

```bash
# Application logs
docker-compose logs -f tenant-manager-1

# Database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Post-Deployment Checklist

- [ ] All services running and healthy
- [ ] SSL certificates installed and valid
- [ ] Firewall rules configured
- [ ] Database backups automated
- [ ] Monitoring dashboards configured
- [ ] Alerts set up and tested
- [ ] Load balancer health checks passing
- [ ] DNS records configured
- [ ] Documentation updated
- [ ] Team trained on operations

---

## 📞 Support

For production support:
- Email: support@twenty.com
- Slack: #tenant-manager-support
- On-call: +1-XXX-XXX-XXXX

---

**Deployment complete! Your enterprise tenant manager is ready to scale to 10,000+ tenants!** 🚀
