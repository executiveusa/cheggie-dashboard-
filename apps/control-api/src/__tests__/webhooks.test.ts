import request from 'supertest';
import { createHmac } from 'crypto';
import { createApp } from '../app';

const app = createApp();
const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'] ?? 'test-webhook-secret';

function sign(body: string): string {
  return createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

describe('Webhook HMAC verification', () => {
  const payload = JSON.stringify({
    source: 'test',
    event_type: 'test.event',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    payload: { test: true },
  });

  it('returns 401 when no signature header', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/receive')
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing webhook signature/i);
  });

  it('returns 401 when signature is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/receive')
      .set('Content-Type', 'application/json')
      .set('x-signature-256', 'sha256=badhash')
      .send(payload);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid webhook signature/i);
  });

  it('passes with valid signature (may fail at DB level but not 401)', async () => {
    const sig = sign(payload);
    const res = await request(app)
      .post('/api/v1/webhooks/receive')
      .set('Content-Type', 'application/json')
      .set('x-signature-256', `sha256=${sig}`)
      .send(payload);
    // Signature is valid so we should NOT get 401
    expect(res.status).not.toBe(401);
  });
});
