# Wosool AI SaaS - Quick Start Guide

Get up and running with Wosool AI SaaS in **under 30 minutes**.

---

## 🎯 What You'll Build

A fully functional multi-tenant SaaS platform with:
- ✅ Twenty CRM backend (from forked repository)
- ✅ Multi-tenant architecture (database-per-tenant)
- ✅ Salla e-commerce integration
- ✅ Clerk authentication
- ✅ Monitoring with Grafana

---

## ⚡ Prerequisites

Before you begin, ensure you have:

- [x] **Docker** 20.10+ installed ([Get Docker](https://docs.docker.com/get-docker/))
- [x] **Docker Compose** 2.0+ installed
- [x] **Git** installed
- [x] **8GB RAM** minimum (16GB recommended)
- [x] **50GB disk space** available

**Check your installation:**

```bash
docker --version          # Should show 20.10+
docker-compose --version  # Should show 2.0+
git --version            # Should show 2.x+
```

---

## 🚀 Installation (5 Steps)

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/Basheirkh/wosool-ai-saas.git
cd wosool-ai-saas

# Initialize submodules (Twenty CRM fork)
git submodule update --init --recursive
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure secrets
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "APP_SECRET=$(openssl rand -hex 32)" >> .env
echo "SUPER_ADMIN_KEY=$(openssl rand -hex 32)" >> .env

# Set a database password
echo "POSTGRES_PASSWORD=your_secure_password_here" >> .env
```

**⚠️ Important:** For development, you can skip Clerk and Salla configuration for now. The system will start without them, but authentication features will be limited.

### Step 3: Build Custom Twenty CRM Image

```bash
# Build the custom Twenty CRM Docker image
# This uses the forked repository with custom Dockerfile
./build-twenty-crm.sh

# ⏱️ This will take 10-20 minutes on first build
# ☕ Grab a coffee!
```

### Step 4: Start the Services

```bash
# Start all services in detached mode
docker-compose up -d

# Check service status
docker-compose ps

# Expected output: All services should show "Up" status
```

### Step 5: Verify Installation

```bash
# Wait for services to be healthy (30-60 seconds)
sleep 60

# Check system health
curl http://localhost/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

## 🎉 Success! What's Next?

### Access Your Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main API** | http://localhost/api | - |
| **Grafana** | http://localhost:3002 | admin / admin |
| **PgAdmin** | http://localhost:5050 | admin@wosool.ai / admin |
| **Redis Commander** | http://localhost:8081 | - |

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f twenty-crm
docker-compose logs -f tenant-manager
```

### Test the API

```bash
# Check health endpoint
curl http://localhost/api/health

# Get system info
curl http://localhost/api/info
```

---

## 🔧 Configure External Services (Optional)

To enable full functionality, configure these external services:

### 1. Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Get your keys from the API Keys section
4. Add to `.env`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### 2. Salla Integration

1. Go to [Salla Developer Portal](https://salla.dev)
2. Register a new application
3. Configure OAuth redirect URI: `http://localhost/salla/callback`
4. Add to `.env`:

```bash
SALLA_CLIENT_ID=your_client_id
SALLA_CLIENT_SECRET=your_client_secret
SALLA_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Restart Services

```bash
# Restart to apply new configuration
docker-compose restart
```

---

## 📊 Explore Grafana Dashboards

1. Open http://localhost:3002
2. Login with `admin` / `admin`
3. Navigate to **Dashboards** → **Browse**
4. Explore pre-configured dashboards:
   - System Overview
   - Tenant Metrics
   - Database Performance

---

## 🧪 Test Multi-Tenancy

### Create a Test Tenant

```bash
curl -X POST http://localhost/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store",
    "slug": "test-store",
    "email": "admin@test-store.com",
    "password": "SecurePassword123!"
  }'
```

### Verify Tenant Creation

```bash
# Check tenant database was created
docker-compose exec tenant-db psql -U postgres -c "\l" | grep test_store
```

---

## 🛑 Stop the Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This deletes all data)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Issue: Services won't start

```bash
# Check logs for errors
docker-compose logs

# Restart services
docker-compose restart
```

### Issue: Port conflicts

```bash
# Check what's using the ports
sudo netstat -tlnp | grep -E ':(80|3000|5432|6379)'

# Stop conflicting services or change ports in docker-compose.yml
```

### Issue: Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes
```

### Issue: Build fails

```bash
# Clean everything and rebuild
docker-compose down -v
docker system prune -a
./build-twenty-crm.sh
docker-compose up -d
```

---

## 📚 Next Steps

Now that you have Wosool AI SaaS running:

1. **Read the Full Documentation**
   - [README.md](README.md) - Complete overview
   - [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Production deployment
   - [Architecture Details](EXECUTIVE-SUMMARY.md)

2. **Explore the Code**
   - `services/tenant-manager/` - Multi-tenant orchestration
   - `services/salla-orchestrator/` - Salla integration
   - `twenty-crm-forked/` - Custom Twenty CRM

3. **Customize for Your Needs**
   - Modify Docker configurations
   - Add custom services
   - Extend the API

4. **Deploy to Production**
   - Follow [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
   - Set up SSL/TLS
   - Configure monitoring alerts

---

## 💬 Get Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/Basheirkh/wosool-ai-saas/issues)
- **Documentation**: Check the `/docs` folder
- **Community**: Join discussions on GitHub

---

## ✅ Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned and submodules initialized
- [ ] Environment variables configured
- [ ] Custom Twenty CRM image built
- [ ] Services started successfully
- [ ] Health check passed
- [ ] Grafana dashboard accessible
- [ ] (Optional) Clerk configured
- [ ] (Optional) Salla configured

---

<div align="center">

**🎉 Congratulations! You're running Wosool AI SaaS!**

[Documentation](README.md) • [Deployment Guide](DEPLOYMENT-GUIDE.md) • [GitHub](https://github.com/Basheirkh/wosool-ai-saas)

</div>
