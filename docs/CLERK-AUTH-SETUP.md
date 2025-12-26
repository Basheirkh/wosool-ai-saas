# 🔐 Clerk Authentication Setup

## Overview

Clerk handles all user authentication. The system:
1. Users authenticate via Clerk (frontend)
2. Clerk JWT tokens contain `org_id` (organization/tenant ID)
3. Token bridge converts Clerk tokens → Twenty CRM tokens
4. Twenty CRM accepts the converted tokens

## Architecture

```
┌─────────────┐
│   Clerk     │ → JWT with org_id
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ Token Bridge API │ → Converts Clerk JWT → Twenty CRM token
│ /api/clerk/auth  │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Twenty CRM      │ → Accepts converted token
└──────────────────┘
```

## Setup Steps

### 1. Configure Clerk

In your Clerk dashboard:
1. Create an application
2. Get your API keys:
   - `CLERK_PUBLISHABLE_KEY` (frontend)
   - `CLERK_SECRET_KEY` (backend)
   - `CLERK_WEBHOOK_SECRET` (for webhooks)

### 2. Update Environment Variables

Add to `.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### 3. Configure Clerk Webhook

In Clerk dashboard → Webhooks:
- URL: `https://your-domain.com/api/clerk/webhooks`
- Events to subscribe:
  - `organization.created`
  - `user.created`
  - `organizationMembership.created`

### 4. Frontend Integration

In your frontend (where Clerk is used):

```javascript
// After Clerk authentication
import { useAuth } from '@clerk/nextjs';

function MyApp() {
  const { getToken, orgId } = useAuth();
  
  // Get Clerk token
  const clerkToken = await getToken();
  
  // Convert to Twenty CRM token
  const response = await fetch('http://localhost:3001/api/clerk/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkToken }),
  });
  
  const { data } = await response.json();
  
  // Set tokenPair cookie for Twenty CRM
  document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(data))}; path=/; sameSite=lax`;
  
  // Redirect to Twenty CRM
  window.location.href = 'http://localhost:3000';
}
```

## API Endpoints

### POST /api/clerk/auth/token
Converts Clerk JWT to Twenty CRM token.

**Request:**
```json
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

### GET /api/clerk/auth/verify
Verifies Clerk token and returns user/tenant info.

**Headers:**
```
Authorization: Bearer <clerk-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_xxx",
    "email": "user@example.com",
    "orgId": "org_xxx",
    "orgRole": "admin",
    "tenant": {
      "id": "tenant-uuid",
      "workspaceId": "workspace-uuid"
    }
  }
}
```

## Browser Integration Script

Create a script that runs after Clerk authentication:

```javascript
// After Clerk login
async function connectToTwentyCRM() {
  const clerkToken = await window.Clerk?.session?.getToken();
  
  if (!clerkToken) {
    console.error('No Clerk token available');
    return;
  }
  
  // Convert token
  const response = await fetch('http://localhost:3001/api/clerk/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkToken }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Set token for Twenty CRM
    document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(result.data))}; path=/; sameSite=lax; max-age=2592000`;
    
    // Redirect or reload
    window.location.href = 'http://localhost:3000';
  } else {
    console.error('Token conversion failed:', result);
  }
}
```

## Tenant Provisioning Flow

1. **User creates organization in Clerk**
   - Clerk webhook → `organization.created`
   - Tenant-manager creates tenant database
   - Links `clerk_org_id` to tenant

2. **User joins organization**
   - Clerk webhook → `organizationMembership.created`
   - Links user to tenant in `global_users`

3. **User logs in**
   - Clerk authenticates user
   - Frontend gets Clerk JWT
   - Token bridge converts to Twenty CRM token
   - User accesses Twenty CRM

## Testing

### Test Clerk Token Conversion

```bash
# Get Clerk token (from frontend after login)
CLERK_TOKEN="your-clerk-jwt-token"

# Convert to Twenty CRM token
curl -X POST http://localhost:3001/api/clerk/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"clerkToken\": \"$CLERK_TOKEN\"}"
```

### Verify Clerk Token

```bash
curl http://localhost:3001/api/clerk/auth/verify \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

## Current Status

✅ Clerk webhook handler exists
✅ Token bridge endpoint created
✅ Tenant resolution from Clerk org_id
⚠️  Needs Clerk SDK integration for proper JWT verification
⚠️  Frontend integration needed

## Next Steps

1. Install Clerk SDK in frontend
2. Configure Clerk webhook URL
3. Test token conversion
4. Integrate with Twenty CRM frontend


