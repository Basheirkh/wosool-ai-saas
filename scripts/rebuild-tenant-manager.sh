#!/bin/bash

# Rebuild Tenant Manager with Revised Clerk Integration
# Run this script to rebuild the tenant-manager service

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔨 REBUILDING TENANT-MANAGER WITH CLERK REVISION         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Error: docker-compose not found"
    echo "   Please install docker-compose or use 'docker compose'"
    exit 1
fi

echo "📦 Step 1: Building tenant-manager..."
$DOCKER_COMPOSE build tenant-manager

echo ""
echo "🔄 Step 2: Restarting tenant-manager..."
$DOCKER_COMPOSE up -d tenant-manager

echo ""
echo "⏳ Step 3: Waiting for service to start..."
sleep 5

echo ""
echo "📊 Step 4: Checking service status..."
$DOCKER_COMPOSE ps tenant-manager

echo ""
echo "📋 Step 5: Recent logs (last 20 lines)..."
$DOCKER_COMPOSE logs --tail=20 tenant-manager

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "🧪 Test the service:"
echo "   curl http://localhost:3001/health"
echo ""
echo "📊 Monitor logs:"
echo "   $DOCKER_COMPOSE logs -f tenant-manager"
echo ""

