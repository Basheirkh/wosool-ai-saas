# 🔗 Clerk + Twenty CRM Integration Guide

## Architecture Overview

**Current Setup:**
- **Tenant Manager**: Creates separate databases per tenant (`twenty_tenant_apple_xxxxx`)
- **Twenty CRM**: Expects workspaces in its own database structure
- **Clerk**: Handles authentication (main page uses Clerk, not Twenty UI)

**Problem:**
- Workspaces are created in tenant databases via raw SQL
- Twenty CRM services are not used → missing metadata, onboarding flags, etc.
- Wizard still shows because onboarding is not marked complete

## Solution: Headless Provisioning Service

Create a provisioning service that:
1. Uses Twenty CRM's services to properly create workspaces
2. Links Clerk users to Twenty CRM users
3. Marks all onboarding flags as complete
4. Can be called from tenant-manager when tenants are registered

## Implementation Plan

### Option A: API Endpoint in Twenty CRM (Recommended)

Create a REST/GraphQL endpoint in Twenty CRM that:
- Accepts tenant provisioning requests
- Uses internal services to create workspace
- Returns workspace ID and user ID
- Marks onboarding complete

**Pros:**
- Uses all Twenty CRM services properly
- Upgrade-safe (uses official APIs)
- Proper transaction handling

**Cons:**
- Requires modifying Twenty CRM codebase
- Need to handle database connection per tenant

### Option B: External Provisioning Service

Create a separate service that:
- Connects to Twenty CRM database
- Uses Twenty CRM's services via dependency injection
- Called from tenant-manager

**Pros:**
- Keeps Twenty CRM codebase clean
- Can be versioned separately

**Cons:**
- More complex setup
- Need to share dependencies

### Option C: Bridge Service (Current Approach - Needs Fix)

Fix the current tenant-manager provisioning to:
- Call Twenty CRM's workspace activation properly
- Set all onboarding flags
- Link Clerk users correctly

## Recommended: Hybrid Approach

1. **Keep tenant databases** for data isolation
2. **Create workspaces in Twenty CRM** for proper initialization
3. **Link them** via tenant registry
4. **Use Clerk JWT** to resolve tenant → workspace

## Next Steps

1. Create provisioning API endpoint in Twenty CRM
2. Update tenant-manager to call this endpoint
3. Store workspace ID in tenant registry
4. Create middleware to resolve workspace from Clerk JWT
5. Mark all onboarding flags as complete

