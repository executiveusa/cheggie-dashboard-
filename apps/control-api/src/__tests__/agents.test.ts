import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Agents routes', () => {
  it('GET /api/v1/agents returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/agents');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/agents returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/agents')
      .send({ name: 'test', type: 'trading' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/v1/agents/:id returns 401 without auth', async () => {
    const res = await request(app).delete(
      '/api/v1/agents/00000000-0000-0000-0000-000000000001'
    );
    expect(res.status).toBe(401);
  });

  it('PATCH /api/v1/agents/:id returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/v1/agents/00000000-0000-0000-0000-000000000001')
      .send({ name: 'updated' });
    expect(res.status).toBe(401);
  });
});
