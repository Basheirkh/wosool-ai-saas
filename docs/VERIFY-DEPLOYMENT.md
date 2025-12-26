# Verify Deployment Status

## Quick Verification Commands

Run these to check if everything is working:

```bash
cd /root/wosool-ai

# 1. Check all container status
docker-compose ps

# 2. Check Twenty CRM logs (should show it's starting properly)
docker logs ent-twenty-crm --tail 30

# 3. Check Tenant Manager logs
docker logs ent-tenant-manager --tail 30

# 4. Check Salla Orchestrator logs
docker logs ent-salla-orchestrator --tail 30

# 5. Test health endpoints
curl -f http://localhost:3001/health  # Tenant Manager
curl -f http://localhost:3000/health  # Twenty CRM (if accessible)

# 6. Test through Nginx
curl -I http://localhost/
curl -I http://api.wosool.ai/

# 7. Check if ports are listening
docker exec ent-twenty-crm netstat -tlnp 2>/dev/null | grep 3000 || docker exec ent-twenty-crm ss -tlnp | grep 3000
docker exec ent-tenant-manager netstat -tlnp 2>/dev/null | grep 3001 || docker exec ent-tenant-manager ss -tlnp | grep 3001
```

## Expected Results

✅ **All containers should show "Running" or "Healthy"**

✅ **Twenty CRM logs should show:**
   - "Working directory: /app"
   - "Starting Twenty CRM Application"
   - No "no such file or directory" errors

✅ **Tenant Manager logs should show:**
   - "✅ Tenant Manager Service running on port 3001"
   - No "trust proxy" warnings

✅ **Health endpoints should return 200 OK**

---

## If Issues Found

### Container keeps restarting:
```bash
# Check logs for errors
docker logs ent-twenty-crm --tail 50
```

### Port not accessible:
```bash
# Check if service is listening
docker exec ent-twenty-crm ss -tlnp | grep 3000
```

### Nginx 502 errors:
```bash
# Check nginx logs
docker logs ent-nginx --tail 50
# Check if upstream services are accessible
docker exec ent-nginx curl -I http://ent-twenty-crm:3000/health
```

