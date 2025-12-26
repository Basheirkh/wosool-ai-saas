#!/bin/bash

# Quick script to get access token and show how to use it

echo "🔐 Tenant Access Helper"
echo "======================"
echo ""

# Get tenant email and password
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <email> <password>"
  echo ""
  echo "Example:"
  echo "  $0 admin@successtest.com password123"
  echo ""
  echo "Available tenants:"
  docker exec wosool-global-db psql -U postgres -d twenty_global -t -c \
    "SELECT '  - ' || email || ' (' || name || ')' FROM global_users gu JOIN tenant_registry tr ON gu.tenant_id = tr.id ORDER BY tr.created_at DESC LIMIT 5;" 2>/dev/null
  exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "Logging in as: $EMAIL"
echo ""

# Login and get token
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Extract token
TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ACCESS TOKEN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$TOKEN"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 HOW TO USE IN BROWSER:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open http://localhost:3000 in your browser"
echo "2. Press F12 to open Developer Console"
echo "3. Paste and run this code:"
echo ""
echo "// Import js-cookie if not available"
echo "if (typeof Cookies === 'undefined') {"
echo "  const script = document.createElement('script');"
echo "  script.src = 'https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/dist/js.cookie.min.js';"
echo "  document.head.appendChild(script);"
echo "  script.onload = function() { setToken(); };"
echo "} else { setToken(); }"
echo ""
echo "function setToken() {"
echo "  const tokenPair = {"
echo "    accessOrWorkspaceAgnosticToken: {"
echo "      token: '$TOKEN',"
echo "      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()"
echo "    },"
echo "    refreshToken: {"
echo "      token: '$TOKEN',"
echo "      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()"
echo "    }"
echo "  };"
echo "  Cookies.set('tokenPair', JSON.stringify(tokenPair), { sameSite: 'lax' });"
echo "  window.location.reload();"
echo "}"
echo ""
echo "OR use this simpler version (requires js-cookie library):"
echo ""
echo "const tokenPair = JSON.stringify({"
echo "  accessOrWorkspaceAgnosticToken: { token: '$TOKEN', expiresAt: new Date(Date.now() + 604800000).toISOString() },"
echo "  refreshToken: { token: '$TOKEN', expiresAt: new Date(Date.now() + 2592000000).toISOString() }"
echo "});"
echo "document.cookie = 'tokenPair=' + encodeURIComponent(tokenPair) + '; path=/; sameSite=lax';"
echo "window.location.reload();"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 OR USE API DIRECTLY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "curl -X POST http://localhost:3000/graphql \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"query\": \"{ me { id email } }\"}'"
echo ""

