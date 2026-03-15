import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Auth middleware', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await request(app).get('/api/v1/agents');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 when invalid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/agents')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });

  it('returns 401 when malformed authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/agents')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
