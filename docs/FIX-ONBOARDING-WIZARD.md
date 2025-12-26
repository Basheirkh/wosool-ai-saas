# 🔧 Fix: Onboarding Wizard Showing After Tenant Registration

## Problem
After registering a tenant via the API, when accessing the Twenty CRM frontend, the onboarding wizard still appears even though the workspace is created.

## Root Cause
The tenant provisioning service creates workspaces and users, but doesn't properly:
1. Clear onboarding flags in `core.keyValuePair` table
2. Assign roles to users properly
3. Mark workspace as fully initialized

## Solution Applied

### 1. Updated Tenant Provisioning Service
Modified `services/tenant-manager/src/services/tenant-provisioning.ts` to:
- Clear all onboarding flags after workspace creation
- Properly assign roles to users
- Ensure workspace is marked as ACTIVE

### 2. Onboarding Flags Cleared
The following flags are now deleted during provisioning:
- `ONBOARDING_CREATE_PROFILE_PENDING`
- `ONBOARDING_CONNECT_ACCOUNT_PENDING`
- `ONBOARDING_INVITE_TEAM_PENDING`
- `ONBOARDING_BOOK_ONBOARDING_PENDING`

### 3. Role Assignment
Users are now properly assigned the Admin role via `core.userRole` table.

## Testing

### Test New Tenant Registration
```bash
curl -X POST http://localhost:3001/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Test Company",
    "admin_email": "admin@test.com",
    "admin_password": "password123"
  }'
```

### Verify Onboarding Flags
```bash
# Connect to tenant database
docker exec -it wosool-tenant-db psql -U postgres -d "twenty_tenant_test-company_xxxxx"

# Check onboarding flags (should be empty)
SELECT * FROM core."keyValuePair" 
WHERE key LIKE 'ONBOARDING%' 
AND "workspaceId" = 'your-workspace-id';
```

### Verify Role Assignment
```sql
SELECT uw.id, u.email, r.label 
FROM core."userWorkspace" uw
JOIN core."user" u ON uw."userId" = u.id
JOIN core."userRole" ur ON ur."userWorkspaceId" = uw.id
JOIN core.role r ON ur."roleId" = r.id
WHERE uw."workspaceId" = 'your-workspace-id';
```

## Expected Result
- ✅ Workspace created with ACTIVE status
- ✅ User created and linked to workspace
- ✅ Admin role assigned to user
- ✅ All onboarding flags cleared
- ✅ Wizard should NOT appear when accessing Twenty CRM frontend

## If Wizard Still Appears

### Check Workspace Activation Status
```sql
SELECT id, "displayName", "activationStatus" 
FROM core.workspace 
WHERE id = 'your-workspace-id';
```
Should be `ACTIVE`, not `PENDING_CREATION` or `ONGOING_CREATION`.

### Check Onboarding Status
The `OnboardingService.getOnboardingStatus()` checks:
1. Workspace activation status
2. User vars (onboarding flags)
3. Billing subscription status

If wizard still appears, check:
- Workspace `activationStatus` is `ACTIVE`
- No pending onboarding flags in `keyValuePair`
- User has proper role assigned

## Next Steps for Clerk Integration

To fully integrate with Clerk:
1. Store Clerk user ID and org ID in `keyValuePair` or custom table
2. Create middleware to resolve workspace from Clerk JWT
3. Link Clerk users to Twenty CRM users on first login

See `CLERK-TWENTY-INTEGRATION.md` for full integration guide.


