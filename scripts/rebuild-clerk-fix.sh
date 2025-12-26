#!/bin/bash

# Rebuild Twenty CRM Frontend with Clerk Fix
# This script rebuilds the frontend with the updated ClerkAuthWrapper

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔨 REBUILDING TWENTY CRM WITH CLERK FIX                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Are you in the right directory?"
    exit 1
fi

echo "📦 Step 1: Building Twenty CRM frontend..."
cd twenty-crm-forked

# Check if yarn is available
if command -v yarn &> /dev/null; then
    echo "✅ Yarn found, building frontend..."
    yarn install
    yarn nx build twenty-front
    echo "✅ Frontend build complete!"
else
    echo "⚠️  Yarn not found. You'll need to rebuild using Docker."
    echo "   Run: docker-compose build twenty-crm"
fi

cd ..

echo ""
echo "🐳 Step 2: Rebuilding Docker container..."
echo "   (If Docker client is too old, you may need to upgrade Docker)"
echo ""

# Try to rebuild with docker-compose
if command -v docker-compose &> /dev/null; then
    docker-compose build twenty-crm 2>&1 | tail -20 || {
        echo "⚠️  Docker build failed. Trying alternative method..."
        echo "   You may need to:"
        echo "   1. Upgrade Docker: sudo apt-get update && sudo apt-get install docker.io"
        echo "   2. Or rebuild manually: cd twenty-crm-forked && yarn build"
    }
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose build twenty-crm 2>&1 | tail -20 || {
        echo "⚠️  Docker build failed. See error above."
    }
else
    echo "❌ Docker not found. Please install Docker or rebuild manually."
    exit 1
fi

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart containers: docker-compose up -d"
echo "   2. Visit: http://localhost:3000/"
echo "   3. Should redirect to Clerk and log you in"
echo ""

