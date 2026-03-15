# Coolify Deployment

## Services to deploy in Coolify

1. **control-api** - Deploy from `apps/control-api/Dockerfile`
2. **realtime-sse** - Deploy from `apps/realtime-sse/Dockerfile`
3. **jobs** - Deploy from `apps/jobs/Dockerfile` (background worker, no public port)
4. **render** - Deploy from `apps/render/Dockerfile`

## Environment Variables
See `docs/ENV_TEMPLATE.md` for all required environment variables.

## Managed Services in Coolify
- Redis: Use Coolify's managed Redis
- Database: Point `SUPABASE_URL` to your Supabase project
