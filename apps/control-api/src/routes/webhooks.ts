import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { webhookVerifyMiddleware } from '../middleware/webhookVerify';
import { getSupabaseAdmin } from '../services/supabase';

const router = Router();

const WebhookPayloadSchema = z.object({
  source: z.string().min(1),
  event_type: z.string().min(1),
  tenant_id: z.string().uuid(),
  payload: z.record(z.unknown()),
});

/**
 * @openapi
 * /api/v1/webhooks/receive:
 *   post:
 *     summary: Receive a signed webhook event
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook received
 *       401:
 *         description: Missing or invalid signature
 */
router.post('/receive', webhookVerifyMiddleware, async (req: Request, res: Response) => {
  const parsed = WebhookPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid webhook payload' });
    return;
  }
  const admin = getSupabaseAdmin();
  await admin.from('webhook_events').insert({
    tenant_id: parsed.data.tenant_id,
    source: parsed.data.source,
    event_type: parsed.data.event_type,
    payload: parsed.data.payload,
  });
  res.json({ received: true });
});

router.get('/events', async (req: Request, res: Response) => {
  const tenantId = req.query['tenant_id'] as string | undefined;
  if (!tenantId) {
    res.status(400).json({ error: 'tenant_id required' });
    return;
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('webhook_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
    return;
  }
  res.json({ data: data ?? [] });
});

export default router;
