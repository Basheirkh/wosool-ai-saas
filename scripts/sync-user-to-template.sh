#!/bin/bash

# Sync user from tenant database to template database
# This allows the user to login via Twenty CRM frontend

TENANT_EMAIL="${1:-admin@successtest.com}"
TENANT_DB="${2}"

if [ -z "$TENANT_DB" ]; then
  echo "Finding tenant database..."
  TENANT_DB=$(docker exec wosool-tenant-db psql -U postgres -c "\l" | grep -E "twenty_tenant.*success" | awk '{print $1}' | head -1)
fi

if [ -z "$TENANT_DB" ]; then
  echo "❌ Could not find tenant database"
  echo "Usage: $0 <email> [database_name]"
  exit 1
fi

echo "📋 Syncing user from $TENANT_DB to template database..."
echo "   Email: $TENANT_EMAIL"

# Get user data from tenant database
USER_DATA=$(docker exec wosool-tenant-db psql -U postgres -d "$TENANT_DB" -t -c "
  SELECT 
    id::text,
    email,
    COALESCE(\"passwordHash\", '')::text,
    COALESCE(\"firstName\", '')::text,
    COALESCE(\"lastName\", '')::text,
    COALESCE(\"isEmailVerified\", false)::text,
    COALESCE(\"canImpersonate\", false)::text,
    COALESCE(\"canAccessFullAdminPanel\", false)::text
  FROM core.\"user\" 
  WHERE email = '$TENANT_EMAIL' 
  LIMIT 1;
" 2>&1 | tr -d ' ')

if [ -z "$USER_DATA" ] || [ "$USER_DATA" = "" ]; then
  echo "❌ User not found in tenant database"
  exit 1
fi

# Parse user data (format: id|email|passwordHash|firstName|lastName|isEmailVerified|canImpersonate|canAccessFullAdminPanel)
IFS='|' read -r USER_ID EMAIL PASSWORD_HASH FIRST_NAME LAST_NAME IS_EMAIL_VERIFIED CAN_IMPERSONATE CAN_ACCESS_ADMIN <<< "$USER_DATA"

echo "✅ Found user: $EMAIL"
echo "   ID: $USER_ID"

# Get workspace ID from tenant database
WORKSPACE_ID=$(docker exec wosool-tenant-db psql -U postgres -d "$TENANT_DB" -t -c "
  SELECT id::text FROM core.workspace LIMIT 1;
" 2>&1 | tr -d ' ')

if [ -z "$WORKSPACE_ID" ]; then
  echo "❌ No workspace found in tenant database"
  exit 1
fi

echo "   Workspace ID: $WORKSPACE_ID"

# Check if user already exists in template database
EXISTING=$(docker exec wosool-tenant-db psql -U postgres -d twenty -t -c "
  SELECT id::text FROM core.\"user\" WHERE email = '$EMAIL' LIMIT 1;
" 2>&1 | tr -d ' ')

if [ -n "$EXISTING" ]; then
  echo "⚠️  User already exists in template database (ID: $EXISTING)"
  echo "   Updating password hash..."
  
  docker exec wosool-tenant-db psql -U postgres -d twenty -c "
    UPDATE core.\"user\" 
    SET \"passwordHash\" = '$PASSWORD_HASH'
    WHERE email = '$EMAIL';
  " 2>&1 | grep -v "UPDATE"
  
  TEMPLATE_USER_ID="$EXISTING"
else
  echo "📝 Creating user in template database..."
  
  # Create user in template database
  docker exec wosool-tenant-db psql -U postgres -d twenty -c "
    INSERT INTO core.\"user\" (
      id, email, \"passwordHash\", 
      \"firstName\", \"lastName\", 
      \"isEmailVerified\", \"canImpersonate\", \"canAccessFullAdminPanel\"
    ) VALUES (
      '$USER_ID', '$EMAIL', '$PASSWORD_HASH',
      '$FIRST_NAME', '$LAST_NAME',
      $IS_EMAIL_VERIFIED, $CAN_IMPERSONATE, $CAN_ACCESS_ADMIN
    ) ON CONFLICT (id) DO UPDATE SET
      \"passwordHash\" = EXCLUDED.\"passwordHash\",
      email = EXCLUDED.email;
  " 2>&1 | grep -v "INSERT\|CONFLICT\|UPDATE"
  
  TEMPLATE_USER_ID="$USER_ID"
fi

# Check if workspace exists in template database
TEMPLATE_WORKSPACE=$(docker exec wosool-tenant-db psql -U postgres -d twenty -t -c "
  SELECT id::text FROM core.workspace WHERE id = '$WORKSPACE_ID' LIMIT 1;
" 2>&1 | tr -d ' ')

if [ -z "$TEMPLATE_WORKSPACE" ]; then
  echo "⚠️  Workspace not found in template database"
  echo "   Note: You may need to create workspace manually or use a different approach"
else
  echo "✅ Workspace exists in template database"
  
  # Link user to workspace
  docker exec wosool-tenant-db psql -U postgres -d twenty -c "
    INSERT INTO core.\"userWorkspace\" (\"userId\", \"workspaceId\")
    VALUES ('$TEMPLATE_USER_ID', '$WORKSPACE_ID')
    ON CONFLICT DO NOTHING;
  " 2>&1 | grep -v "INSERT\|CONFLICT"
  
  echo "✅ User linked to workspace"
fi

echo ""
echo "✅ User synced successfully!"
echo ""
echo "🌐 Now you can login via browser:"
echo "   1. Open http://localhost:3000"
echo "   2. Use email: $EMAIL"
echo "   3. Use your tenant password"
echo ""
echo "Or use GraphQL:"
echo "   curl -X POST http://localhost:3000/graphql \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\": \"mutation { signIn(email: \\\"$EMAIL\\\", password: \\\"YOUR_PASSWORD\\\") { tokens { accessOrWorkspaceAgnosticToken { token } } } }\"}'"


