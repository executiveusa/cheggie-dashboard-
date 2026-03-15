import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { channelMap } from './channelMap';
import type { SSEEventType } from '@cheggie/shared';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] ?? '';
const INTERNAL_SECRET = process.env['INTERNAL_SECRET'] ?? 'dev-internal-secret';
const SSE_PORT = parseInt(process.env['SSE_PORT'] ?? '3002', 10);
const HEARTBEAT_INTERVAL_MS = 30_000;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verifyToken(token: string): Promise<{ userId: string; tenantId: string } | null> {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', data.user.id).single();
    if (!profile) return null;
    return { userId: data.user.id, tenantId: profile.tenant_id };
  } catch {
    return null;
  }
}

// SSE endpoint
app.get('/sse/:tenantId', async (req: Request, res: Response) => {
  const { tenantId } = req.params as { tenantId: string };
  const token = req.query['token'] as string | undefined;
  const lastEventId = (req.headers['last-event-id'] as string | undefined) ?? null;

  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const verified = await verifyToken(token);
  if (!verified || verified.tenantId !== tenantId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const client = channelMap.addClient(tenantId, {
    userId: verified.userId,
    tenantId,
    response: res,
    lastEventId,
    connectedAt: new Date(),
  });

  // Send connected event
  res.write(`id: ${uuidv4()}\nevent: connected\ndata: ${JSON.stringify({ client_id: client.id, tenant_id: tenantId })}\n\n`);

  // Heartbeat
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, HEARTBEAT_INTERVAL_MS);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    channelMap.removeClient(tenantId, client.id);
  });
});

// Internal emit endpoint
app.post('/internal/emit', (req: Request, res: Response) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { tenantId, event, data } = req.body as { tenantId: string; event: SSEEventType; data: unknown };
  if (!tenantId || !event) {
    res.status(400).json({ error: 'tenantId and event are required' });
    return;
  }

  const eventId = uuidv4();
  channelMap.broadcast(tenantId, eventId, event, { ...((data as Record<string, unknown>) ?? {}), timestamp: new Date().toISOString() });

  res.json({ broadcast: true, clients: channelMap.getTenantCount(tenantId), event_id: eventId });
});

// Stats endpoint
app.get('/internal/stats', (req: Request, res: Response) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ total_clients: channelMap.getTotalCount() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: channelMap.getTotalCount(), timestamp: new Date().toISOString() });
});

app.listen(SSE_PORT, () => {
  console.log(`[realtime-sse] Listening on port ${SSE_PORT}`);
});
