# Quick Deployment Guide

## 🚀 Fast Track to Production

This guide provides the **fastest path** to deploy the fixed Twenty CRM system.

---

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with required variables
- Access to the deployment server

---

## Deployment Steps

### 1. Stop Existing Containers

```bash
docker-compose down
```

### 2. Rebuild Twenty CRM Service

```bash
docker-compose build --no-cache twenty-crm
```

**Why `--no-cache`?**  
Ensures all changes are picked up, especially the new entrypoint script.

### 3. Start All Services

```bash
docker-compose up -d
```

### 4. Monitor Startup Logs

```bash
docker-compose logs -f twenty-crm
```

**What to look for:**
- `[INFO] Twenty CRM Container Initialization`
- `[SUCCESS] Database migrations completed successfully`
- `[INFO] Starting application server...`
- `[INFO] Working directory: /app`

**Press Ctrl+C to exit log view** (containers keep running)

### 5. Verify Service is Running

```bash
# Check container status
docker ps | grep ent-twenty-crm

# Check port binding
docker exec ent-twenty-crm ss -tlnp | grep 3000
```

**Expected output:**
```
LISTEN 0      511          0.0.0.0:3000       0.0.0.0:*    users:(("node",pid=1,fd=19))
```

### 6. Test Endpoints

```bash
# Test health endpoint
curl -f http://localhost:3000/health

# Test through Nginx (if configured)
curl -f http://api.wosool.ai/welcome
```

**Expected:** HTTP 200 responses

---

## Verification Checklist

- [ ] Container `ent-twenty-crm` is running
- [ ] Port 3000 is listening (verified with `ss -tlnp`)
- [ ] Health endpoint returns 200
- [ ] Nginx returns 200 (no 502 errors)
- [ ] Logs show successful startup

---

## If Something Goes Wrong

### Container Exits Immediately

```bash
# Check logs for errors
docker logs ent-twenty-crm

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Configuration error
```

### Port 3000 Not Binding

```bash
# Check if yarn start is running
docker exec ent-twenty-crm ps aux | grep node

# Check working directory in logs
docker logs ent-twenty-crm | grep "Working directory"

# Should show: Working directory: /app
```

### Still Getting 502 Errors

```bash
# Check Nginx can reach the container
docker exec ent-nginx ping -c 3 ent-twenty-crm

# Check Nginx logs
docker logs ent-nginx --tail 50

# Restart Nginx
docker-compose restart nginx
```

---

## Rollback Procedure

If the new version has issues:

```bash
# 1. Stop containers
docker-compose down

# 2. Restore old files (if you have backups)
cp backup/docker-entrypoint.sh services/twenty-crm/scripts/
cp backup/Dockerfile services/twenty-crm/
cp backup/docker-compose.yml .

# 3. Rebuild and restart
docker-compose build twenty-crm
docker-compose up -d
```

---

## Post-Deployment

### Monitor for 24 Hours

```bash
# Check logs periodically
docker logs ent-twenty-crm --tail 100

# Monitor resource usage
docker stats ent-twenty-crm

# Check health status
docker inspect ent-twenty-crm | grep -A 10 Health
```

### Set Up Alerts (Recommended)

```bash
# Add to crontab for health monitoring
*/5 * * * * curl -f http://localhost:3000/health || echo "Twenty CRM health check failed" | mail -s "Alert" admin@example.com
```

---

## Success Indicators

✅ Container stays running for > 1 hour  
✅ Port 3000 consistently listening  
✅ Health endpoint always returns 200  
✅ No 502 errors from Nginx  
✅ Application logs show normal operation  
✅ Database connections stable  
✅ Memory usage stable (not growing)

---

## Getting Help

1. **Check the comprehensive documentation**: `PRODUCTION-FIX-DOCUMENTATION.md`
2. **Review logs**: `docker logs ent-twenty-crm`
3. **Check container health**: `docker inspect ent-twenty-crm`
4. **Contact DevOps team** with logs and error messages

---

## What Changed?

This deployment includes:

1. **Fixed entrypoint script** - Proper working directory management
2. **Improved Dockerfile** - Better error handling and health checks
3. **Updated docker-compose.yml** - Enhanced configuration and resource limits

**Key Fix**: The application now starts from `/app` (monorepo root) instead of `/app/packages/twenty-server`, which resolves the Nx workspace resolution issue.

---

**Estimated Deployment Time**: 5-10 minutes  
**Downtime**: ~2-3 minutes  
**Risk Level**: Low (easy rollback available)
