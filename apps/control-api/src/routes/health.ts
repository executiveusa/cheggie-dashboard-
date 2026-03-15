import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../services/supabase';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is degraded
 */
router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = { api: 'ok' };
  try {
    const admin = getSupabaseAdmin();
    await admin.from('tenants').select('count').limit(1);
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
