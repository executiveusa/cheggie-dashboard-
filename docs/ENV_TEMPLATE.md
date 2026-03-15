# Environment Variables Reference

Copy this to `.env` and fill in the values. Never commit `.env` to git.

---

## Shared (all services)

```env
# Internal service-to-service secret (generate: openssl rand -hex 32)
INTERNAL_SECRET=

# Supabase project
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## control-api

```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Secrets encryption (hex, 64 chars = 32 bytes)
# Generate: openssl rand -hex 32
SECRETS_ENCRYPTION_KEY=

# Redis
REDIS_URL=redis://localhost:6379

# Webhook HMAC validation
WEBHOOK_SECRET=

# LiteLLM proxy
LITELLM_BASE_URL=http://localhost:4000
LITELLM_API_KEY=

# Postiz social scheduler
POSTIZ_API_URL=http://localhost:3000
POSTIZ_API_KEY=

# Internal service URLs
INTERNAL_SECRET=
SSE_SERVICE_URL=http://localhost:3002
RENDER_SERVICE_URL=http://localhost:3003
```

---

## realtime-sse

```env
SSE_PORT=3002
SUPABASE_URL=
SUPABASE_ANON_KEY=
INTERNAL_SECRET=
```

---

## jobs

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=redis://localhost:6379
SSE_SERVICE_URL=http://localhost:3002
INTERNAL_SECRET=
```

---

## render

```env
RENDER_PORT=3003
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=redis://localhost:6379
SSE_SERVICE_URL=http://localhost:3002
INTERNAL_SECRET=
```

---

## LiteLLM (optional self-hosted)

```env
LITELLM_API_KEY=
LITELLM_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/litellm
```

---

## Postiz (optional self-hosted)

```env
POSTIZ_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postiz
POSTIZ_JWT_SECRET=
```

---

## Local postgres (docker-compose.dev.yml only)

```env
POSTGRES_PASSWORD=postgres
```
