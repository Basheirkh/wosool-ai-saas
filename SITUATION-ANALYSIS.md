# Detailed Situation Analysis - api.wosool.ai 502 Bad Gateway

## Current Status

**URL**: `http://api.wosool.ai/welcome`  
**Error**: `502 Bad Gateway` (nginx/1.25.5)  
**Server**: `167.99.20.94` (root@167.99.20.94)

---

## What We've Fixed So Far

### ✅ Completed Fixes

1. **Nginx Configuration**
   - Created `/nginx/conf.d/wosool.conf` for `api.wosool.ai`
   - Configured proxy_pass to `ent-twenty-crm:3000`
   - Added proper headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
   - Fixed container name references (was using `twenty-crm`, now `ent-twenty-crm`)

2. **Docker Compose**
   - Fixed container names with `ent-` prefix
   - Removed port conflicts (Redis, PostgreSQL)
   - Created `ent-network` for service communication
   - Updated database connection strings to use correct container names

3. **Database**
   - Created `twenty_tenant_template` database
   - Database is accessible and migrations run successfully

4. **Firewall**
   - Opened ports 80 and 443

5. **Entrypoint Script**
   - Fixed `yarn start:prod` → `yarn start` (the script doesn't exist)
   - Updated to use correct working directory

---

## Current Problem: 502 Bad Gateway

### Root Cause Analysis

The 502 error means:
- ✅ Nginx is running and receiving requests
- ✅ Nginx can resolve the domain `api.wosool.ai`
- ❌ Nginx **cannot connect** to the upstream service (`ent-twenty-crm:3000`)

### Why Nginx Can't Connect

**Issue #1: Service Not Listening on Port 3000**

The Twenty CRM service starts but never actually listens on port 3000:

```
Starting HTTP server...
   No command provided, using default: yarn start
   Twenty CRM server started in background (PID: 89)
⏳ Waiting for Twenty CRM server to start...
   Still waiting... (30/300s)
   Still waiting... (60/300s)
   ... (waits up to 300 seconds, then times out)
```

**Evidence:**
- `docker exec ent-twenty-crm ss -tlnp | grep 3000` → **No output** (port not listening)
- `docker exec ent-twenty-crm netstat -tlnp | grep 3000` → **No output**
- Nginx logs show: `connect() failed (113: Host is unreachable) while connecting to upstream`

**Issue #2: The `yarn start` Command Fails**

When we manually run `yarn start` inside the container:
```
NX   Could not find Nx modules at "/app".
Have you run npm/yarn install?
```

This means:
- The Twenty CRM base image (`twentycrm/twenty:latest`) expects dependencies to be installed
- The working directory might be wrong
- The `yarn start` command needs to run from `/app` not `/app/packages/twenty-server`

**Issue #3: Entrypoint Script Working Directory**

The entrypoint script does:
```bash
cd /app/packages/twenty-server  # Line 8
# ... migrations ...
# Then tries to start:
cd /app && yarn start  # This might not work
```

But `yarn start` is defined in `/app/package.json`, not in `/app/packages/twenty-server/package.json`.

---

## Technical Details

### Container Status

```bash
# All containers are running:
ent-nginx: Up
ent-twenty-crm: Up (but service not listening)
ent-tenant-manager: Up
ent-tenant-db: Up (healthy)
ent-global-db: Up (healthy)
ent-redis: Up (healthy)
```

### Network Configuration

- **Network**: `twenty-crm-enterprise-v1_ent-network`
- **All containers**: Connected to `ent-network`
- **Nginx can ping**: `ent-twenty-crm` (network connectivity OK)
- **Nginx cannot connect**: Port 3000 not listening

### Environment Variables

```bash
PORT=3000
PG_DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@ent-tenant-db:5432/twenty_tenant_template
REDIS_URL=redis://ent-redis:6379
```

### Nginx Configuration

**File**: `/nginx/conf.d/wosool.conf`

```nginx
server {
    listen 80;
    server_name api.wosool.ai;

    location /welcome {
        proxy_pass http://ent-twenty-crm:3000/welcome;
        # ... headers ...
    }
    
    location / {
        proxy_pass http://ent-twenty-crm:3000;
        # ... headers ...
    }
}
```

**Status**: ✅ Configuration is correct

### Entrypoint Script

**File**: `services/twenty-crm/scripts/docker-entrypoint.sh`

**Current flow:**
1. Line 8: `cd /app/packages/twenty-server`
2. Lines 11-21: Run migrations (works ✅)
3. Lines 24-28: Register cron jobs (works ✅)
4. Lines 30-38: Start server with `yarn start` (fails ❌)

**Problem**: 
- Script changes to `/app/packages/twenty-server` 
- But `yarn start` needs to run from `/app` (root of monorepo)
- The `yarn start` command uses `nx` which needs the monorepo root

---

## The Actual Problem

The Twenty CRM is a **monorepo** using Nx. The `yarn start` command in the root `package.json` runs:

```json
"start": "npx concurrently --kill-others 'npx nx run-many -t start -p twenty-server twenty-front' 'npx wait-on tcp:3000 && npx nx run twenty-server:worker'"
```

This command:
1. Starts `twenty-server` and `twenty-front` packages
2. Waits for port 3000 to be ready
3. Starts the worker

**But** the entrypoint script is in `/app/packages/twenty-server` when it tries to run `yarn start`, so Nx can't find the workspace.

---

## Solutions to Try

### Solution 1: Fix Working Directory in Entrypoint

Change the entrypoint script to ensure `yarn start` runs from `/app`:

```bash
# Before starting server, go back to /app
cd /app
yarn start > /tmp/twenty.log 2>&1 &
```

### Solution 2: Use the Base Image's Default Command

The `twentycrm/twenty:latest` image likely has its own entrypoint. Instead of overriding it completely, we might need to:
- Let the base image handle startup
- Only inject our migration script before/after

### Solution 3: Check Base Image Documentation

The Twenty CRM Docker image might expect:
- Different environment variables
- Different startup command
- Dependencies already installed

### Solution 4: Use Production Build Command

Instead of `yarn start` (dev mode), try:
- `yarn build` then `yarn start:prod` (if it exists)
- Or check what the base image's CMD is

### Solution 5: Check Logs for Actual Errors

```bash
docker exec ent-twenty-crm cat /tmp/twenty.log
```

This will show what error `yarn start` is actually producing.

---

## Diagnostic Commands

Run these on the server to diagnose:

```bash
# 1. Check if service is listening
docker exec ent-twenty-crm ss -tlnp | grep 3000

# 2. Check startup logs
docker exec ent-twenty-crm cat /tmp/twenty.log

# 3. Check what processes are running
docker exec ent-twenty-crm ps aux

# 4. Check if yarn start is actually running
docker exec ent-twenty-crm ps aux | grep -E '(yarn|node|nx)'

# 5. Try starting manually from correct directory
docker exec -it ent-twenty-crm sh
cd /app
yarn start

# 6. Check Nx workspace
docker exec ent-twenty-crm ls -la /app/.nx

# 7. Check if dependencies are installed
docker exec ent-twenty-crm ls -la /app/node_modules | head -5

# 8. Check the base image's default command
docker inspect twentycrm/twenty:latest | grep -A 5 -E '(Cmd|Entrypoint)'
```

---

## Files That Need Investigation

1. **`services/twenty-crm/scripts/docker-entrypoint.sh`**
   - Line 8: Working directory change
   - Lines 30-38: Server startup command
   - Need to ensure `yarn start` runs from `/app`

2. **`services/twenty-crm/Dockerfile`**
   - Check if it properly extends the base image
   - Verify dependencies are installed

3. **Base Image**: `twentycrm/twenty:latest`
   - What's its default CMD/ENTRYPOINT?
   - What environment does it expect?

---

## Next Steps to Debug

1. **Check the actual error**:
   ```bash
   docker exec ent-twenty-crm cat /tmp/twenty.log
   ```

2. **Try starting manually**:
   ```bash
   docker exec -it ent-twenty-crm sh
   cd /app
   yarn start
   # Watch for errors
   ```

3. **Check base image**:
   ```bash
   docker inspect twentycrm/twenty:latest
   ```

4. **Verify Nx workspace**:
   ```bash
   docker exec ent-twenty-crm ls -la /app/.nx
   docker exec ent-twenty-crm cat /app/nx.json
   ```

5. **Check if there's a production start script**:
   ```bash
   docker exec ent-twenty-crm cat /app/package.json | grep -A 10 scripts
   ```

---

## Summary

**The Issue**: 
The Twenty CRM service never actually starts listening on port 3000 because:
1. The entrypoint script runs `yarn start` from wrong directory
2. Or `yarn start` fails due to missing Nx workspace context
3. The service process starts but crashes/doesn't bind to port

**The Fix**:
- Ensure `yarn start` runs from `/app` (monorepo root)
- Or use the base image's intended startup method
- Check `/tmp/twenty.log` for actual errors
- Verify Nx workspace is properly initialized

**Current State**:
- ✅ Infrastructure: All containers running, network OK
- ✅ Database: Created and accessible
- ✅ Nginx: Configured correctly
- ❌ Application: Not starting/listening on port 3000

