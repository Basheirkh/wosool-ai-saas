# 🔄 Clerk Redirect Setup for Twenty CRM

## Overview

The Twenty CRM frontend now automatically redirects to Clerk for authentication when Clerk is configured. Users will be redirected to Clerk's sign-in/sign-up page instead of seeing the default Twenty CRM authentication UI.

## How It Works

1. User visits `/sign-in-up` or `/welcome`
2. `ClerkRedirectEffect` component checks if Clerk is enabled
3. If enabled, user is redirected to Clerk's hosted sign-in page
4. After authentication, Clerk redirects back with a session token
5. Token is converted to Twenty CRM format via token bridge
6. User is logged into Twenty CRM

## Configuration

### Option 1: Using Clerk Hosted Pages (Recommended)

Add to your `.env` or environment variables:

```env
# Clerk Publishable Key (required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# OR Clerk Frontend API (alternative)
VITE_CLERK_FRONTEND_API=your-app.clerk.accounts.dev
```

The system will automatically construct Clerk's hosted sign-in URL from the publishable key.

### Option 2: Custom Clerk Sign-In URLs

If you have custom Clerk sign-in/sign-up pages:

```env
VITE_CLERK_SIGN_IN_URL=https://your-domain.com/sign-in
VITE_CLERK_SIGN_UP_URL=https://your-domain.com/sign-up
```

### Option 3: Using Window Variables (For Dynamic Configuration)

You can also set Clerk configuration dynamically in your HTML:

```html
<script>
  window.__CLERK_PUBLISHABLE_KEY__ = 'pk_test_xxxxx';
  window.__CLERK_FRONTEND_API__ = 'your-app.clerk.accounts.dev';
  // OR
  window.__CLERK_SIGN_IN_URL__ = 'https://your-domain.com/sign-in';
  window.__CLERK_SIGN_UP_URL__ = 'https://your-domain.com/sign-up';
</script>
```

## Clerk Configuration

### 1. Configure Redirect URLs in Clerk Dashboard

In your Clerk dashboard, add these redirect URLs:

- **After Sign In**: `http://localhost:3000/sign-in-up`
- **After Sign Up**: `http://localhost:3000/sign-in-up`

For production:
- `https://your-domain.com/sign-in-up`

### 2. Configure Webhook (Optional but Recommended)

Set up Clerk webhook to auto-provision tenants:

- **Webhook URL**: `https://your-domain.com/api/clerk/webhooks`
- **Events**: 
  - `organization.created`
  - `user.created`
  - `organizationMembership.created`

## Testing

### Test Redirect

1. Visit `http://localhost:3000/sign-in-up`
2. You should be automatically redirected to Clerk
3. Sign in/up with Clerk
4. You should be redirected back to Twenty CRM
5. You should be logged in automatically

### Debug

If redirect doesn't work:

1. Check browser console for errors
2. Verify environment variables are set
3. Check Clerk dashboard redirect URLs
4. Verify token bridge is accessible at `http://localhost:3001/api/clerk/auth/token`

## Files Modified

- `twenty-crm-forked/packages/twenty-front/src/modules/auth/components/ClerkRedirectEffect.tsx` - Redirect logic
- `twenty-crm-forked/packages/twenty-front/src/pages/auth/SignInUp.tsx` - Integrated redirect effect

## Flow Diagram

```
User → /sign-in-up
  ↓
ClerkRedirectEffect checks if Clerk enabled
  ↓
Redirect to Clerk sign-in page
  ↓
User authenticates with Clerk
  ↓
Clerk redirects back with session token
  ↓
ClerkRedirectEffect receives token
  ↓
Call token bridge: POST /api/clerk/auth/token
  ↓
Set tokenPair cookie
  ↓
Reload page → User logged into Twenty CRM
```

## Troubleshooting

**"Not redirecting to Clerk"**
- Check `VITE_CLERK_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Verify Clerk is enabled in code

**"Redirect loop"**
- Check Clerk redirect URLs are correct
- Verify token bridge is working
- Check browser console for errors

**"Token conversion fails"**
- Verify tenant-manager is running
- Check `/api/clerk/auth/token` endpoint
- Verify Clerk token is valid

## Next Steps

1. Set environment variables
2. Configure Clerk redirect URLs
3. Test the flow
4. Deploy to production


