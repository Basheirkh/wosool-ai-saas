# Troubleshooting: api.wosool.ai Connection Refused

## Quick Diagnostic Steps

Run these commands on your server to diagnose the issue:

```bash
cd /root/wosool-ai

# 1. Check if all containers are running
docker-compose ps

# 2. Check if nginx container is running and healthy
docker ps | grep nginx

# 3. Check if nginx is listening on port 80
docker exec ent-nginx netstat -tlnp | grep :80
# OR
docker exec ent-nginx ss -tlnp | grep :80

# 4. Check nginx logs for errors
docker-compose logs nginx | tail -50

# 5. Test nginx from inside the container
docker exec ent-nginx curl -I http://localhost/

# 6. Check if port 80 is open on the server
netstat -tlnp | grep :80
ss -tlnp | grep :80

# 7. Check firewall status
ufw status
# OR
iptables -L -n | grep 80

# 8. Test from server itself
curl -I http://localhost/
curl -I http://api.wosool.ai/
curl -I http://167.99.20.94/
```

---

## Common Issues & Fixes

### Issue 1: Nginx Container Not Running

**Check:**
```bash
docker-compose ps | grep nginx
```

**Fix:**
```bash
# Start nginx
docker-compose up -d nginx

# Or restart all services
docker-compose restart
```

---

### Issue 2: Port 80 Not Accessible (Firewall)

**Check:**
```bash
ufw status
```

**Fix:**
```bash
# Allow port 80
ufw allow 80/tcp
ufw allow 443/tcp

# If using iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

### Issue 3: DNS Not Pointed to Server

**Check:**
```bash
# What IP does api.wosool.ai resolve to?
nslookup api.wosool.ai
dig api.wosool.ai

# What is your server's actual IP?
curl ifconfig.me
# OR
hostname -I
```

**Fix:**
- Go to your DNS provider (Cloudflare, GoDaddy, etc.)
- Point `api.wosool.ai` A record to your server's IP: `167.99.20.94` or `138.197.23.213`
- Wait for DNS propagation (can take a few minutes to 24 hours)

---

### Issue 4: Nginx Configuration Error

**Check:**
```bash
# Test nginx configuration
docker exec ent-nginx nginx -t

# Check nginx error logs
docker-compose logs nginx | grep -i error
```

**Fix:**
```bash
# If config is invalid, fix it and reload
docker-compose restart nginx

# Or rebuild
docker-compose up -d --force-recreate nginx
```

---

### Issue 5: Backend Services Not Running

**Check:**
```bash
# Check if tenant-manager is running
docker ps | grep tenant-manager

# Check if twenty-crm is running
docker ps | grep twenty-crm

# Test backend services directly
curl http://localhost:3001/health
curl http://localhost:3000/health
```

**Fix:**
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs tenant-manager
docker-compose logs twenty-crm
```

---

## Quick Fix Script

Run this complete diagnostic and fix script:

```bash
#!/bin/bash
cd /root/wosool-ai

echo "=== Checking Services ==="
docker-compose ps

echo ""
echo "=== Checking Nginx ==="
docker ps | grep nginx || echo "❌ Nginx not running"
docker exec ent-nginx nginx -t 2>&1 || echo "❌ Nginx config error"

echo ""
echo "=== Checking Ports ==="
netstat -tlnp | grep :80 || echo "❌ Port 80 not listening"

echo ""
echo "=== Checking DNS ==="
echo "Your server IP:"
curl -s ifconfig.me
echo ""
echo "DNS resolution for api.wosool.ai:"
nslookup api.wosool.ai || dig api.wosool.ai

echo ""
echo "=== Checking Firewall ==="
ufw status || iptables -L -n | grep 80

echo ""
echo "=== Testing Locally ==="
curl -I http://localhost/ 2>&1 | head -5

echo ""
echo "=== Nginx Logs (last 10 lines) ==="
docker-compose logs --tail=10 nginx
```

Save as `check-api.sh`, make it executable, and run:
```bash
chmod +x check-api.sh
./check-api.sh
```

---

## Manual Fixes

### If Nginx is Not Running:

```bash
cd /root/wosool-ai
docker-compose up -d nginx
docker-compose logs -f nginx
```

### If Port 80 is Blocked:

```bash
# Ubuntu/Debian
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Or disable firewall temporarily to test
ufw disable  # Test first, then re-enable
```

### If DNS is Wrong:

1. Check your current server IP:
   ```bash
   curl ifconfig.me
   ```

2. Update DNS A record:
   - Go to your DNS provider
   - Create/Update A record: `api.wosool.ai` → Your Server IP
   - TTL: 300 (5 minutes) for testing

3. Wait and verify:
   ```bash
   nslookup api.wosool.ai
   # Should show your server IP
   ```

---

## Expected Results

After fixes, you should see:

```bash
# 1. Nginx running
$ docker ps | grep nginx
CONTAINER ID   IMAGE              STATUS
abc123def456   nginx:1.25-alpine  Up 5 minutes

# 2. Port 80 listening
$ netstat -tlnp | grep :80
tcp6  0  0  :::80  :::*  LISTEN  1234/nginx

# 3. Local test works
$ curl -I http://localhost/
HTTP/1.1 200 OK
Server: nginx/1.25.5

# 4. DNS resolves correctly
$ nslookup api.wosool.ai
Name: api.wosool.ai
Address: 167.99.20.94  # Your server IP
```

---

## Still Not Working?

If after all fixes it still doesn't work:

1. **Check DigitalOcean Firewall:**
   - Go to DigitalOcean Dashboard → Networking → Firewalls
   - Ensure HTTP (port 80) and HTTPS (port 443) are allowed

2. **Check if using IP directly works:**
   ```bash
   curl -I http://167.99.20.94/
   ```
   If IP works but domain doesn't → DNS issue
   If IP doesn't work → Server/firewall issue

3. **Test from server:**
   ```bash
   # SSH into server and test
   curl -I http://localhost/
   curl -I http://api.wosool.ai/
   ```

4. **Check nginx access/error logs:**
   ```bash
   docker-compose logs nginx | tail -100
   docker exec ent-nginx tail -50 /var/log/nginx/error.log
   ```

---

**Next Steps:** Run the diagnostic commands above and share the output to identify the exact issue.

