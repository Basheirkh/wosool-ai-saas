# Wosool AI SaaS - Multi-Tenant CRM Platform

<div align="center">

**Enterprise-grade multi-tenant SaaS platform built on Twenty CRM**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](docker-compose.yml)
[![Twenty CRM](https://img.shields.io/badge/Twenty%20CRM-Forked-orange.svg)](https://github.com/twentyhq/twenty)

</div>

---

## 🚀 Overview

Wosool AI SaaS is a production-ready, enterprise-grade multi-tenant SaaS platform that transforms **Twenty CRM** into a powerful, scalable solution with **Salla e-commerce integration** and **Clerk authentication**. This project demonstrates the **headless CRM architecture** approach, where Twenty CRM serves as a robust backend engine while maintaining complete control over authentication, multi-tenancy, and user experience.

### Key Differentiators

- **✅ Forked Twenty CRM**: Built from a forked repository with custom Docker image (not using official image)
- **✅ True Multi-Tenancy**: Database-per-tenant architecture for maximum isolation and security
- **✅ Salla Integration**: Automatic tenant provisioning when merchants install the Salla app
- **✅ Clerk Authentication**: Modern, secure authentication with organization support
- **✅ Production-Ready**: Comprehensive error handling, logging, and monitoring

---

## ✨ Features

### 🏢 Enterprise Multi-Tenancy
- **Scalability**: Designed to handle 10,000+ tenants with optimized connection pooling
- **Isolation**: Each tenant has a dedicated PostgreSQL database for maximum security
- **Performance**: Redis-based caching layer reduces database lookups by 99%
- **Async Provisioning**: Non-blocking tenant creation using Bull/Redis queues

### 🛒 Salla E-commerce Integration
- **Automatic Onboarding**: Tenants created automatically when merchants install the Salla app
- **Data Synchronization**: Background sync of Customers, Products, and Orders from Salla to CRM
- **Webhook Security**: HMAC-SHA256 signature verification for all Salla events
- **Saudi Arabia Ready**: Built specifically for the KSA e-commerce market

### 🔐 Clerk Authentication
- **Modern Auth**: Passwordless, MFA, and social login support
- **Organization Management**: Clerk organizations map directly to tenants
- **JWT-based**: Secure, stateless authentication with JWT tokens
- **Headless Integration**: Twenty CRM becomes auth-agnostic

### 🤖 ElevenLabs AI Widget
- **Deep Context**: Advanced tools for store content, cart, and user behavior awareness
- **Automatic Injection**: Widget automatically injected into Salla stores upon installation
- **White-labeled**: Fully customizable branding options

### 📊 Monitoring & Operations
- **Prometheus & Grafana**: Real-time metrics and dashboards for system health
- **Admin Dashboard**: Centralized API for managing tenants and monitoring pools
- **Health Checks**: Comprehensive health checks for all services
- **Logging**: Structured logging with log rotation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WOSOOL AI SAAS                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼─────┐
        │    Salla     │  │    Clerk    │  │  Nginx   │
        │ Orchestrator │  │    Auth     │  │  Proxy   │
        └───────┬──────┘  └──────┬──────┘  └────┬─────┘
                │                │              │
                └────────────────┼──────────────┘
                                 │
                        ┌────────▼────────┐
                        │ Tenant Manager  │
                        │  (Node.js/TS)   │
                        └────────┬────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼─────┐
        │  Twenty CRM  │  │  Global DB  │  │  Redis   │
        │ (Headless)   │  │ (Postgres)  │  │  Cache   │
        └──────────────┘  └─────────────┘  └──────────┘
                │
        ┌───────▼──────┐
        │  Tenant DBs  │
        │ (Per-Tenant) │
        └──────────────┘
```

### Component Breakdown

#### **Twenty CRM (Forked & Customized)**
- Built from forked repository with custom Dockerfile
- Headless backend providing REST/GraphQL APIs
- Custom entrypoint script with production-grade error handling
- Multi-stage Docker build for optimized image size
- Proper Nx monorepo context handling

#### **Tenant Manager**
- Node.js/TypeScript service for tenant orchestration
- Handles tenant provisioning, database creation, and lifecycle management
- Connection pooling and caching for high performance
- Admin API for operational tasks

#### **Salla Orchestrator**
- Python FastAPI service for Salla integration
- Webhook handling with signature verification
- Background data synchronization
- OAuth flow management

---

## 📁 Project Structure

```
wosool-ai-saas/
├── twenty-crm-forked/                    # Forked Twenty CRM repository
│   ├── packages/
│   │   ├── twenty-server/                # Backend server
│   │   ├── twenty-front/                 # Frontend (optional)
│   │   └── twenty-docker/
│   │       └── twenty/
│   │           ├── Dockerfile.custom     # Custom production Dockerfile
│   │           └── entrypoint.custom.sh  # Production-ready entrypoint
│   ├── package.json                      # Monorepo dependencies
│   └── nx.json                           # Nx workspace configuration
│
├── services/
│   ├── tenant-manager/                   # Tenant orchestration service
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── salla-orchestrator/               # Salla integration service
│       ├── app/
│       ├── Dockerfile
│       └── requirements.txt
│
├── nginx/                                # Nginx configuration
│   ├── nginx.conf
│   └── conf.d/
│       └── wosool.conf
│
├── monitoring/                           # Monitoring configuration
│   ├── prometheus.yml
│   └── grafana/
│
├── public/                               # Static assets
│   └── widget/                           # ElevenLabs AI widget
│
├── docker-compose.yml                    # Full stack orchestration
├── .env.example                          # Environment variables template
├── build-twenty-crm.sh                   # Build script for custom image
└── README.md                             # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Node.js** 18+ (for local development)
- **Git** for cloning the repository

### 1. Clone the Repository

```bash
git clone https://github.com/Basheirkh/wosool-ai-saas.git
cd wosool-ai-saas
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and fill in your actual values
nano .env
```

**Required Environment Variables:**

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# Application Secrets
JWT_SECRET=your_jwt_secret
SUPER_ADMIN_KEY=your_admin_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Salla Integration
SALLA_CLIENT_ID=your_client_id
SALLA_CLIENT_SECRET=your_client_secret
SALLA_WEBHOOK_SECRET=your_webhook_secret

# Application URLs
APP_URL=https://wosool.ai
CRM_BASE_URL=api.wosool.ai
```

### 3. Build Custom Twenty CRM Image

```bash
# Build the custom Twenty CRM Docker image from forked repo
./build-twenty-crm.sh

# This will take 10-20 minutes depending on your system
```

### 4. Launch the Stack

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Verify Deployment

```bash
# Check system health
curl http://localhost/api/health

# Access services:
# - Grafana: http://localhost:3002 (admin/admin)
# - PgAdmin: http://localhost:5050
# - Redis Commander: http://localhost:8081
```

---

## 🛠️ Operational Commands

### Register a New Tenant

```bash
curl -X POST http://localhost/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "slug": "mystore",
    "email": "admin@mystore.com",
    "password": "securepassword"
  }'
```

### Check System Health

```bash
curl http://localhost/api/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f twenty-crm
docker-compose logs -f tenant-manager
```

---

## 🔧 Development

### Building Custom Twenty CRM Image

```bash
# Build with custom tag
./build-twenty-crm.sh v1.0.0

# Build with latest tag (default)
./build-twenty-crm.sh
```

### Local Development

```bash
# Install dependencies for tenant-manager
cd services/tenant-manager
npm install

# Run in development mode
npm run dev
```

### Database Migrations

```bash
# Run migrations manually
docker-compose exec twenty-crm yarn database:migrate:prod

# Skip migrations on startup (set in .env)
DISABLE_DB_MIGRATIONS=true
```

---

## 📊 Monitoring

### Grafana Dashboards

Access Grafana at `http://localhost:3002` (default: `admin/admin`)

**Available Dashboards:**
- System Overview
- Tenant Metrics
- Database Performance
- API Request Rates

### Prometheus Metrics

Access Prometheus at `http://localhost:9092`

---

## 🔒 Security

### Best Practices Implemented

1. **Database-per-tenant**: Maximum isolation and security
2. **Non-root containers**: All containers run as non-root users
3. **Webhook signature verification**: HMAC-SHA256 for Salla webhooks
4. **JWT authentication**: Secure, stateless authentication
5. **Environment variable secrets**: No hardcoded credentials
6. **Health checks**: Automatic container restart on failure

### Generate Secure Secrets

```bash
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For APP_SECRET
openssl rand -hex 32  # For SUPER_ADMIN_KEY
```

---

## 📚 Documentation

- **[Architecture Deep Dive](EXECUTIVE-SUMMARY.md)** - Detailed system architecture
- **[Deployment Guide](DEPLOY-INSTRUCTIONS.md)** - Production deployment instructions
- **[API Documentation](SERVICE-MAPPING.md)** - API endpoints and usage
- **[Troubleshooting](TROUBLESHOOT-DOMAIN.md)** - Common issues and solutions
- **[Read First](read-first.txt)** - Critical implementation details and rationale

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **[Twenty CRM](https://github.com/twentyhq/twenty)** - The amazing open-source CRM that powers this platform
- **[Salla](https://salla.dev)** - Saudi Arabia's leading e-commerce platform
- **[Clerk](https://clerk.com)** - Modern authentication and user management

---

<div align="center">

**Built with ❤️ for the Saudi Arabian e-commerce ecosystem**

[Documentation](./docs) • [API Reference](./SERVICE-MAPPING.md) • [GitHub](https://github.com/Basheirkh/wosool-ai-saas)

</div>
