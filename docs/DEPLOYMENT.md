# Deployment Guide — Coolify

## Prerequisites

- Coolify instance (self-hosted or cloud)
- Supabase project (cloud or self-hosted)
- Domain with DNS configured

---

## 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run migrations in order via Supabase SQL Editor:
   - `supabase/migrations/001_core_tables.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_indexes.sql`
3. Copy your project URL, anon key, and service role key

---

## 2. Redis

In Coolify, create a managed **Redis** service and note the internal connection URL (e.g. `redis://redis:6379`).

---

## 3. Deploy Services

For each service below, create a new **Docker** application in Coolify pointing at this repo.

### control-api
- **Dockerfile path:** `apps/control-api/Dockerfile`
- **Port:** 3001
- **Domain:** `api.yourdomain.com`

### realtime-sse
- **Dockerfile path:** `apps/realtime-sse/Dockerfile`
- **Port:** 3002
- **Domain:** `sse.yourdomain.com`

### jobs (background worker)
- **Dockerfile path:** `apps/jobs/Dockerfile`
- **Port:** none (background worker)

### render
- **Dockerfile path:** `apps/render/Dockerfile`
- **Port:** 3003
- **Domain:** internal only (accessed via `RENDER_SERVICE_URL`)

---

## 4. Environment Variables

Set the following env vars on each service (see `docs/ENV_TEMPLATE.md` for full reference):

| Variable | control-api | realtime-sse | jobs | render |
|---|---|---|---|---|
| `SUPABASE_URL` | ✓ | ✓ | ✓ | ✓ |
| `SUPABASE_ANON_KEY` | ✓ | ✓ | | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | | ✓ | ✓ |
| `REDIS_URL` | ✓ | | ✓ | ✓ |
| `INTERNAL_SECRET` | ✓ | ✓ | ✓ | ✓ |
| `SSE_SERVICE_URL` | ✓ | | ✓ | ✓ |
| `SECRETS_ENCRYPTION_KEY` | ✓ | | | |
| `WEBHOOK_SECRET` | ✓ | | | |

---

## 5. Network / Proxy

- Configure Coolify's Traefik proxy to route:
  - `api.yourdomain.com` → control-api:3001
  - `sse.yourdomain.com` → realtime-sse:3002
- Enable TLS (Let's Encrypt) on both domains
- For SSE, add the header rule: `X-Accel-Buffering: no`

---

## 6. Health Checks

Configure Coolify health checks:
- control-api: `GET /health`
- realtime-sse: `GET /health`
- render: `GET /health`

---

## 7. Scaling

- **jobs**: Scale horizontally — each instance picks up queue work from Redis via BullMQ
- **render**: Scale up to match video rendering demand (CPU-intensive)
- **realtime-sse**: Scale with sticky sessions or a pub/sub fan-out layer for multi-instance
