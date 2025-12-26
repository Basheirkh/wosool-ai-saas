# 🚀 Quick Fix: tokenPair is undefined

## The Problem
Twenty CRM expects tokens in **cookies** (not localStorage) with a specific format.

## Quick Solution (Copy & Paste)

### Step 1: Get Your Token
```bash
cd /home/ubuntu/saas/wosool-ai-saas
./access-tenant.sh admin@successtest.com password123
```

Copy the `ACCESS TOKEN` from the output.

### Step 2: Set Token in Browser

1. Open `http://localhost:3000`
2. Press **F12** (Developer Console)
3. Paste this code (replace `YOUR_TOKEN` with your actual token):

```javascript
const token = "YOUR_TOKEN";
const tokenPair = {
  accessOrWorkspaceAgnosticToken: {
    token: token,
    expiresAt: new Date(Date.now() + 604800000).toISOString()
  },
  refreshToken: {
    token: token,
    expiresAt: new Date(Date.now() + 2592000000).toISOString()
  }
};
document.cookie = 'tokenPair=' + encodeURIComponent(JSON.stringify(tokenPair)) + '; path=/; sameSite=lax';
window.location.reload();
```

4. Press **Enter**
5. Page reloads → You should see your tenant workspace!

## Why This Works

- ✅ Uses **cookies** (not localStorage) - Twenty CRM reads from cookies
- ✅ Correct **tokenPair format** - Matches Twenty CRM's expected structure
- ✅ Proper **expiration dates** - 7 days for access, 30 days for refresh
- ✅ **SameSite=lax** - Required for cookie security

## Available Tenants

```bash
docker exec wosool-global-db psql -U postgres -d twenty_global -c \
  "SELECT slug, name, (SELECT email FROM global_users WHERE tenant_id = tr.id LIMIT 1) as admin_email FROM tenant_registry tr ORDER BY created_at DESC;"
```

## Troubleshooting

**Still seeing "tokenPair is undefined":**
- Clear all cookies: `document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));`
- Try setting token again
- Check token is valid (not expired)

**Token not working:**
- Verify token is from tenant-manager API
- Check tenant exists and is active
- Ensure workspace is ACTIVE in tenant database


