# Deployment Command

## Run this command on the server via DigitalOcean Console:

```bash
cd /root/twenty-crm-enterprise-v1 && git pull && chmod +x deploy-server.sh && ./deploy-server.sh
```

This will:
1. Pull the latest code from GitHub
2. Make the deployment script executable
3. Run the deployment script which will:
   - Install Docker & Docker Compose (if needed)
   - Create .env file with generated secrets
   - Fix any configuration issues
   - Build and start all services

## After deployment, access:
- Main Application: http://167.99.20.94
- Grafana: http://167.99.20.94:3000 (admin/admin)
- Prometheus: http://167.99.20.94:9092
- PgAdmin: http://167.99.20.94:5050

## Important Notes:
- Update SALLA_CLIENT_ID and SALLA_CLIENT_SECRET in .env after first deployment
- Check logs with: `docker compose logs -f`
- Stop services with: `docker compose down`

