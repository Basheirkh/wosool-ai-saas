# 🎯 Simple Clerk Setup for Twenty CRM

## ✅ What's Done

The Twenty CRM frontend now automatically redirects to Clerk when `VITE_CLERK_PUBLISHABLE_KEY` is set.

## Configuration

### 1. Set Environment Variable

Add to your `.env` file:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZW1lcmdpbmctc2tpbmstNzUuY2xlcmsuYWNjb3VudHMuZGV2JA
```

### 2. Configure Clerk Dashboard

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Configure → Paths**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
3. **Configure → Domains**:
   - Add: `http://localhost:3000` (for development)
   - Add your production domain (for production)

### 3. Rebuild Frontend

```bash
# Stop dev server (if running)
# Then restart
pnpm dev

# Or for production
pnpm build
```

## How It Works

1. User visits `http://localhost:3000/sign-in`
2. `ClerkAuthWrapper` detects Clerk is enabled
3. Redirects to Clerk's hosted sign-in page
4. User authenticates with Clerk
5. Clerk redirects back to `/sign-in?__session=...`
6. Token is converted to Twenty CRM format
7. User is logged into Twenty CRM ✅

## Testing

1. Visit: `http://localhost:3000/sign-in`
2. Should automatically redirect to Clerk
3. Sign in/up with Clerk
4. Should redirect back and log into Twenty CRM

## Troubleshooting

**Not redirecting?**
- Check `VITE_CLERK_PUBLISHABLE_KEY` is set
- Restart dev server after setting env var
- Check browser console for errors

**Redirect loop?**
- Check Clerk dashboard redirect URLs
- Verify domain is added in Clerk dashboard

**Token conversion fails?**
- Check tenant-manager is running on port 3001
- Verify `/api/clerk/auth/token` endpoint is accessible

## Files Modified

- `twenty-crm-forked/packages/twenty-front/src/modules/auth/components/ClerkAuthWrapper.tsx` - Redirect logic
- `twenty-crm-forked/packages/twenty-front/src/pages/auth/SignInUp.tsx` - Integrated Clerk wrapper

That's it! Simple and straightforward. ✅


