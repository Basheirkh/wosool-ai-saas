# Deployment Instructions for Cloud Server

## Quick Setup on Cloud Server (167.99.20.94)

### Option 1: Direct Download and Run (Recommended)

SSH into your server and run:

```bash
ssh root@167.99.20.94
```

Then execute:

```bash
curl -fsSL https://raw.githubusercontent.com/Basheirkh/wosool-ai/master/server-setup-standalone.sh -o /tmp/setup.sh && chmod +x /tmp/setup.sh && bash /tmp/setup.sh
```

### Option 2: Manual Clone and Setup

```bash
# SSH into server
ssh root@167.99.20.94

# Clean any existing files
rm -rf /root/* /root/.*

# Clone repository
git clone https://github.com/Basheirkh/wosool-ai.git /root/wosool-ai
cd /root/wosool-ai

# Run setup script
chmod +x server-setup-standalone.sh
bash server-setup-standalone.sh
```

### Option 3: Step-by-Step Manual Setup

```bash
# 1. SSH into server
ssh root@167.99.20.94

# 2. Install prerequisites
apt-get update
apt-get install -y git curl openssl

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
systemctl enable docker
systemctl start docker

# 4. Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 5. Clone repository
git clone https://github.com/Basheirkh/wosool-ai.git /root/wosool-ai
cd /root/wosool-ai

# 6. Run deployment script
chmod +x deploy-server.sh
./deploy-server.sh
```

## After Setup

The script will:
- Install Docker and Docker Compose
- Clone the repository to `/root/wosool-ai`
- Create `.env` file with generated secrets
- Build and deploy all services

## Access Points

After deployment, you can access:
- **Main Application**: http://167.99.20.94
- **Grafana Dashboard**: http://167.99.20.94:3002 (admin/admin)
- **Prometheus**: http://167.99.20.94:9092
- **PgAdmin**: http://167.99.20.94:5050

## Important: Update Credentials

After the first setup, edit `/root/wosool-ai/.env` and update:
- `SALLA_CLIENT_ID`
- `SALLA_CLIENT_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

Then restart services:
```bash
cd /root/wosool-ai
docker compose down
docker compose up -d
```

## Useful Commands

```bash
# Check service status
cd /root/wosool-ai
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Update from GitHub
cd /root/wosool-ai
git pull
docker compose build
docker compose up -d
```

