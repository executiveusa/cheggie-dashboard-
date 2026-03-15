import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 or 503 with status field', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBeLessThanOrEqual(503);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('api', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('returns JSON content type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
