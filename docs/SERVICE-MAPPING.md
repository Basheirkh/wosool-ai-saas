# Industry-Standard Service Mapping

## Service Architecture

All services are routed through nginx (ports 80/443) with no external port mappings.

## Route Mapping

### Frontend
- **`api.wosool.ai/`** → Twenty CRM Frontend (`ent-twenty-crm:3000`)
  - All root paths not matching other routes
  - Includes static assets, UI, and main application

### Backend APIs

- **`api.wosool.ai/api/*`** → Tenant Manager (`ent-tenant-manager:3001`)
  - All `/api/*` routes except `/api/salla/*`
  - Includes Clerk webhooks, tenant management, etc.

- **`api.wosool.ai/api/salla/*`** → Salla Orchestrator (`ent-salla-orchestrator:8000`)
  - Salla-specific API endpoints
  - OAuth callbacks and webhooks

- **`api.wosool.ai/graphql`** → Twenty CRM GraphQL (`ent-twenty-crm:3000`)
  - GraphQL endpoint with CORS support

- **`api.wosool.ai/rest/*`** → Twenty CRM REST (`ent-twenty-crm:3000`)
  - REST API endpoints

### Admin/Monitoring

- **`api.wosool.ai/admin/grafana/*`** → Grafana (`ent-grafana:3000`)
  - Metrics visualization
  - Internal port: 3000 (mapped from host 3002)

- **`api.wosool.ai/admin/prometheus/*`** → Prometheus (`ent-prometheus:9090`)
  - Metrics collection and querying

- **`api.wosool.ai/admin/pgadmin/*`** → PgAdmin (`ent-pgadmin:80`)
  - Database management interface

- **`api.wosool.ai/admin/redis/*`** → Redis Commander (`ent-redis-commander:8081`)
  - Redis management interface

### Static Assets

- **`api.wosool.ai/public/*`** → Static files
  - Widget and tools served directly by nginx
  - Cached for 1 year

## Security Features

- **Rate Limiting**: 
  - API routes: 100 requests/second (burst: 20-30)
  - Auth routes: 10 requests/second (burst: 5)
  - Admin routes: 100 requests/second (burst: 10)

- **Security Headers**:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin

- **CORS**: Enabled for GraphQL endpoint

## Port Configuration

All services run on internal Docker network only:
- No external port mappings (except nginx 80/443)
- Services communicate via Docker network names
- Grafana internal port: 3000 (was conflicting with Twenty CRM)

## Testing Routes

```bash
# Frontend
curl http://api.wosool.ai/

# Health check
curl http://api.wosool.ai/health

# GraphQL
curl -X POST http://api.wosool.ai/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Tenant Manager API
curl http://api.wosool.ai/api/health

# Salla API
curl http://api.wosool.ai/api/salla/health

# Admin routes (require authentication)
curl http://api.wosool.ai/admin/grafana/
curl http://api.wosool.ai/admin/prometheus/
curl http://api.wosool.ai/admin/pgadmin/
curl http://api.wosool.ai/admin/redis/
```

## Deployment

1. Run cleanup script:
   ```bash
   ./clean-server-fresh-start.sh
   ```

2. Verify services:
   ```bash
   docker-compose ps
   docker logs -f ent-nginx
   ```

3. Test routes:
   ```bash
   curl http://api.wosool.ai/health
   ```

