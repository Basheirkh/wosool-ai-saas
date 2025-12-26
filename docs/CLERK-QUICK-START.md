# 🚀 Clerk Authentication - Quick Start Guide

## ✅ What's Ready

Clerk authentication is now fully integrated! Here's what was created:

1. **Clerk Auth Service** - Verifies Clerk JWT tokens and resolves tenants
2. **Token Bridge API** - Converts Clerk tokens to Twenty CRM format
3. **Browser Integration** - Script to connect Clerk to Twenty CRM
4. **Webhook Handler** - Auto-provisions tenants from Clerk organizations

## 🔄 How It Works

```
User → Clerk Login → Get JWT Token → Token Bridge → Twenty CRM Token → Access CRM
```

## 📋 Setup Steps

### 1. Configure Clerk Environment Variables

Add to your `.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### 2. Add Browser Integration Script

In your frontend (where Clerk is used), add this script:

```html
<script src="/clerk-browser-integration.js"></script>
```

Or copy the contents of `clerk-browser-integration.js` into your app.

### 3. Connect After Clerk Login

After user authenticates via Clerk:

```javascript
// Get Clerk token
const token = await window.Clerk.session.getToken();

// Connect to Twenty CRM
await connectClerkToTwentyCRM(token);
```

Or use auto-connect:
```javascript
// Auto-connects if Clerk session exists
await autoConnectIfClerkAuthenticated();
```

## 🌐 API Endpoints

### Convert Clerk Token to Twenty CRM Token

```bash
POST http://localhost:3001/api/clerk/auth/token
Content-Type: application/json

{
  "clerkToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessOrWorkspaceAgnosticToken": {
      "token": "eyJhbGc...",
      "expiresAt": "2025-12-26T..."
    },
    "refreshToken": {
      "token": "eyJhbGc...",
      "expiresAt": "2026-01-25T..."
    }
  }
}
```

### Verify Clerk Token

```bash
GET http://localhost:3001/api/clerk/auth/verify
Authorization: Bearer <clerk-token>
```

## 🔗 Complete Flow

1. **User logs in via Clerk** (your main page)
2. **Get Clerk JWT**: `await Clerk.session.getToken()`
3. **Call token bridge**: `POST /api/clerk/auth/token`
4. **Set tokenPair cookie** (done automatically by script)
5. **Redirect to Twenty CRM**: `http://localhost:3000`
6. **User is authenticated** ✅

## 📁 Files Created

- `services/tenant-manager/src/services/clerk-auth.service.ts` - Core Clerk auth logic
- `services/tenant-manager/src/api/clerk/auth.ts` - Token bridge API
- `clerk-browser-integration.js` - Browser integration script
- `CLERK-AUTH-SETUP.md` - Detailed setup guide
- `CLERK-QUICK-START.md` - This file

## 🧪 Testing

### Test Token Conversion

```bash
# Get Clerk token from your frontend
CLERK_TOKEN="your-clerk-jwt-token"

# Convert to Twenty CRM token
curl -X POST http://localhost:3001/api/clerk/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"clerkToken\": \"$CLERK_TOKEN\"}"
```

### Test Verification

```bash
curl http://localhost:3001/api/clerk/auth/verify \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

## 🎯 Next Steps

1. **Configure Clerk Webhook** (optional but recommended)
   - URL: `https://your-domain.com/api/clerk/webhooks`
   - Events: `organization.created`, `user.created`, `organizationMembership.created`

2. **Add Integration Script** to your frontend
   - Load `clerk-browser-integration.js`
   - Call `connectClerkToTwentyCRM()` after Clerk login

3. **Test End-to-End**
   - Login via Clerk
   - Verify token conversion works
   - Access Twenty CRM

## 💡 Key Points

- ✅ **Clerk handles all authentication** - No passwords stored
- ✅ **Automatic tenant resolution** - From Clerk `org_id`
- ✅ **Token bridge** - Seamless conversion to Twenty CRM format
- ✅ **Auto-provisioning** - Tenants created from Clerk organizations

## 🐛 Troubleshooting

**"Token conversion failed"**
- Check Clerk token is valid
- Verify tenant exists for Clerk org_id
- Check tenant-manager logs

**"Tenant not found"**
- Ensure Clerk webhook created tenant
- Or manually create tenant and link `clerk_org_id`

**"Invalid token type"**
- Make sure you're using the token bridge, not Clerk token directly
- Token bridge converts to correct format automatically


