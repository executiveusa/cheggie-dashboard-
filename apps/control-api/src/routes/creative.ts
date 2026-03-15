import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { StartRenderSchema } from '@cheggie/shared';
import { queueRenderJob, getRenderJobStatus } from '../services/remotionService';

const router = Router();
router.use(authMiddleware, requireTenant);

/**
 * @openapi
 * /api/v1/creative/render:
 *   post:
 *     summary: Queue a Remotion render job
 *     tags: [Creative]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Render job queued
 */
router.post('/render', requireRole('marketing'), async (req: Request, res: Response) => {
  const parsed = StartRenderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const result = await queueRenderJob(
      req.tenantId!,
      parsed.data.composition_id,
      parsed.data.props,
      req.userId!
    );
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to queue render' });
  }
});

router.get('/render/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await getRenderJobStatus(req.tenantId!, req.params['jobId']!);
    res.json({ data: job });
  } catch {
    res.status(404).json({ error: 'Render job not found' });
  }
});

export default router;
