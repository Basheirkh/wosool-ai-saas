#!/bin/bash

# Multi-Tenant Manager Setup Script
# This script helps set up the tenant manager service

set -e

echo "🚀 Multi-Tenant Manager Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env and configure:${NC}"
    echo "   - GLOBAL_DATABASE_URL"
    echo "   - POSTGRES_ADMIN_PASSWORD"
    echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
    echo "   - SUPER_ADMIN_KEY (generate with: openssl rand -base64 32)"
    echo ""
    read -p "Press Enter to continue after editing .env..."
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
echo "🔍 Checking required environment variables..."
REQUIRED_VARS=("GLOBAL_DATABASE_URL" "POSTGRES_ADMIN_USER" "POSTGRES_ADMIN_PASSWORD" "POSTGRES_HOST" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please edit .env and set these variables."
    exit 1
fi

echo -e "${GREEN}✅ All required environment variables are set${NC}"
echo ""

# Check if PostgreSQL is accessible
echo "🔍 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    if PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_ADMIN_USER" -d postgres -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
    else
        echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
        echo "Please check your PostgreSQL credentials in .env"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql command not found. Skipping PostgreSQL connection check.${NC}"
fi
echo ""

# Check if global database exists
echo "🔍 Checking global database..."
GLOBAL_DB_NAME=$(echo "$GLOBAL_DATABASE_URL" | sed 's/.*\///')

if command -v psql &> /dev/null; then
    if PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_ADMIN_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$GLOBAL_DB_NAME"; then
        echo -e "${GREEN}✅ Global database '$GLOBAL_DB_NAME' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Global database '$GLOBAL_DB_NAME' does not exist. Creating...${NC}"
        PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_ADMIN_USER" -d postgres -c "CREATE DATABASE $GLOBAL_DB_NAME;"
        echo -e "${GREEN}✅ Created global database '$GLOBAL_DB_NAME'${NC}"
    fi
fi
echo ""

# Check if source database exists
SOURCE_DB="${SOURCE_DATABASE_NAME:-twenty}"
echo "🔍 Checking source database..."

if command -v psql &> /dev/null; then
    if PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_ADMIN_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$SOURCE_DB"; then
        echo -e "${GREEN}✅ Source database '$SOURCE_DB' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Source database '$SOURCE_DB' does not exist.${NC}"
        echo "This database will be used as a template for tenant schemas."
        echo ""
        read -p "Do you want to create it now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_ADMIN_USER" -d postgres -c "CREATE DATABASE $SOURCE_DB;"
            echo -e "${GREEN}✅ Created source database '$SOURCE_DB'${NC}"
            echo -e "${YELLOW}⚠️  Note: You need to populate this database with your schema before creating tenants.${NC}"
        else
            echo -e "${YELLOW}⚠️  Skipping source database creation. Set SOURCE_DATABASE_NAME in .env to use a different database.${NC}"
        fi
    fi
fi
echo ""

# Check if Node.js dependencies are installed
echo "🔍 Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not installed. Installing...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Build the application
echo "🔨 Building application..."
if [ ! -d "dist" ]; then
    npm run build
    echo -e "${GREEN}✅ Application built${NC}"
else
    echo -e "${YELLOW}⚠️  dist/ directory exists. Rebuilding...${NC}"
    npm run build
    echo -e "${GREEN}✅ Application rebuilt${NC}"
fi
echo ""

# Run global database migrations
echo "🔄 Running global database migrations..."
npm run migrate:global
echo -e "${GREEN}✅ Global database migrations completed${NC}"
echo ""

# Summary
echo "=============================="
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "To start the service:"
echo "  npm start              # Production mode"
echo "  npm run dev            # Development mode"
echo ""
echo "API will be available at:"
echo "  http://localhost:${PORT:-3001}"
echo ""
echo "Health check:"
echo "  curl http://localhost:${PORT:-3001}/health"
echo ""
echo "Register a tenant:"
echo "  curl -X POST http://localhost:${PORT:-3001}/api/auth/register-organization \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"organization_name\":\"ACME\",\"admin_email\":\"admin@acme.com\",\"admin_password\":\"SecurePass123!\"}'"
echo ""
