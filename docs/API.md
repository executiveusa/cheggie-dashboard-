# API Reference — Cheggie Control Plane

Base URL: `https://api.yourdomain.com`

All authenticated endpoints require an `Authorization: Bearer <supabase_jwt>` header.

---

## Authentication

### `POST /auth/register`
Register a new user and tenant.

**Body**
```json
{ "email": "user@example.com", "password": "...", "tenantName": "Acme" }
```

**Response `201`**
```json
{ "user": { "id": "...", "email": "..." }, "tenant": { "id": "...", "slug": "acme" } }
```

---

### `POST /auth/login`
Exchange credentials for a Supabase session.

**Body**
```json
{ "email": "user@example.com", "password": "..." }
```

**Response `200`**
```json
{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }
```

---

## Agents

### `GET /agents`
List all agents for the authenticated tenant.

**Response `200`**
```json
{
  "data": [
    { "id": "...", "name": "Trading Bot", "type": "trading", "status": "idle", "version": 1 }
  ]
}
```

---

### `POST /agents`
Create a new agent.

**Body**
```json
{
  "name": "Trading Bot",
  "type": "trading",
  "config": { "symbol": "BTC/USD" },
  "model_policy": { "provider": "openai", "model": "gpt-4o" },
  "tool_allowlist": ["web_search", "calculator"]
}
```

**Response `201`**
```json
{ "data": { "id": "...", "name": "Trading Bot", "status": "idle" } }
```

---

### `GET /agents/:id`
Get a single agent by ID.

---

### `PATCH /agents/:id`
Update agent config. Increments `version`.

---

### `DELETE /agents/:id`
Soft-delete an agent (sets `status = stopped`).

---

### `POST /agents/:id/run`
Trigger an agent run.

**Body**
```json
{ "config": { "dry_run": true } }
```

**Response `202`**
```json
{ "run_id": "...", "status": "pending" }
```

---

### `GET /agents/:id/runs`
Paginated list of runs for an agent.

---

### `GET /agents/:id/runs/:runId/logs`
Stream logs for a run (returns array of log entries).

---

## Connectors

### `GET /connectors`
List trading connectors.

### `POST /connectors`
Create a connector.

**Body**
```json
{ "type": "alpaca", "name": "Paper Account", "mode": "paper", "config": { "api_key": "..." } }
```

### `DELETE /connectors/:id`
Remove a connector.

---

## Secrets

### `GET /secrets`
List secret key names (values never returned).

### `POST /secrets`
Store an encrypted secret.

**Body**
```json
{ "key_name": "OPENAI_API_KEY", "value": "sk-..." }
```

### `DELETE /secrets/:keyName`
Delete a secret by key name.

---

## Approvals

### `GET /approvals`
List pending/historical approvals.

### `POST /approvals/:id/approve`
Approve a pending action (requires `admin` or `owner` role).

### `POST /approvals/:id/reject`
Reject a pending action.

---

## Social Posts

### `GET /social/posts`
List posts (filterable by `status`, `platform`).

### `POST /social/posts`
Create/schedule a post.

**Body**
```json
{
  "platform": "twitter",
  "content": "Hello world!",
  "scheduled_at": "2024-12-01T10:00:00Z"
}
```

### `PATCH /social/posts/:id`
Update post (draft/scheduled only).

### `DELETE /social/posts/:id`
Delete a draft post.

---

## Blog

### `GET /blog/posts`
List blog posts.

### `POST /blog/posts`
Create a blog post.

### `PATCH /blog/posts/:id`
Update a blog post.

### `POST /blog/posts/:id/publish`
Publish a blog post.

---

## Creative / Render

### `GET /creative/compositions`
List available video compositions.

### `POST /creative/render`
Queue a render job.

**Body**
```json
{ "composition_id": "trading-report", "props": { "title": "Weekly Report" } }
```

**Response `202`**
```json
{ "job_id": "...", "status": "queued" }
```

### `GET /creative/render/:jobId`
Get render job status.

---

## AI Governance / LLM

### `GET /ai-governance/usage`
LLM usage stats for the tenant.

### `GET /ai-governance/routing-rules`
List model routing rules.

### `POST /ai-governance/routing-rules`
Create a routing rule.

---

## Webhooks

### `POST /webhooks/:source`
Receive an inbound webhook. Validates HMAC signature (`X-Webhook-Signature`).

---

## Real-time SSE

Connect to `GET /sse/:tenantId?token=<jwt>` on the `realtime-sse` service (port 3002).

**Events emitted:**
| Event | Description |
|---|---|
| `connected` | Connection established |
| `agent.started` | Agent run began |
| `agent.log` | Log line from a run |
| `run.completed` | Run finished (success or failure) |
| `render.progress` | Render job progress (0–100) |
| `render.done` | Render finished, `output_url` available |
| `social.published` | Social post published |
| `approval.required` | Human approval needed |

---

## Health

All services expose `GET /health` returning:
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```
