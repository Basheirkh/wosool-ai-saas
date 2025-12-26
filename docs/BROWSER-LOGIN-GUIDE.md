# 🌐 Browser Login Guide

## Quick Start

### Step 1: Open Browser Console
1. Navigate to `http://localhost:3000`
2. Press **F12** (or right-click → Inspect → Console tab)

### Step 2: Load the Login Script
Copy and paste the entire contents of `browser-login.js` into the console, then press Enter.

### Step 3: Login
```javascript
loginToTenant('admin@successtest.com', 'password123')
```

## Available Functions

### `loginToTenant(email, password)`
Logs in using tenant-manager credentials and attempts to authenticate with Twenty CRM.

**Example:**
```javascript
loginToTenant('admin@successtest.com', 'password123')
```

**What it does:**
1. Authenticates with tenant-manager API
2. Gets tenant and user information
3. Attempts to login via Twenty CRM GraphQL
4. Sets tokenPair cookie if successful
5. Reloads the page

### `listTenants()`
Lists available API endpoints and shows how to get tenant list.

## Troubleshooting

### "Login failed: User doesn't exist in template database"
This is expected if your user only exists in the tenant database, not the template database.

**Solution:** The script will attempt a token bridge, but this has limitations. For full functionality, you need to:
1. Implement a proper token bridge endpoint in tenant-manager
2. Or configure Twenty CRM for multi-tenant support

### "Invalid token type" error
The token bridge approach may not work because Twenty CRM requires specific token formats.

**Solution:** Use the tenant-manager API directly for now.

### Network errors
Make sure:
- Tenant-manager is running on `http://localhost:3001`
- Twenty CRM is running on `http://localhost:3000`
- No CORS issues (check browser console)

## Alternative: Direct GraphQL Login

If your user exists in the template database, you can login directly:

```javascript
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      mutation SignIn($email: String!, $password: String!) {
        signIn(email: $email, password: $password) {
          tokens {
            accessOrWorkspaceAgnosticToken {
              token
              expiresAt
            }
            refreshToken {
              token
              expiresAt
            }
          }
        }
      }
    `,
    variables: {
      email: 'admin@successtest.com',
      password: 'password123'
    }
  })
})
.then(r => r.json())
.then(data => {
  if (data.data?.signIn?.tokens) {
    const tokenPair = data.data.signIn.tokens;
    document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(tokenPair))}; path=/; sameSite=lax`;
    window.location.reload();
  }
});
```

## Current Limitations

1. **Token Format Incompatibility**: Tenant-manager tokens don't match Twenty CRM's expected format
2. **Database Separation**: Users in tenant databases aren't accessible to Twenty CRM (connected to template DB)
3. **No Native Bridge**: Requires custom implementation for full integration

## Next Steps

For production use, implement:
1. Token bridge endpoint in tenant-manager
2. Multi-tenant middleware in Twenty CRM
3. Proper tenant resolution from JWT tokens


