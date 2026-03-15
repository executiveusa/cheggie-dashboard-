import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { getAgentStatus, spawnAgent, terminateAgent } from '../services/openfangService';
import { isKillSwitchEnabled } from '../services/agentService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/:agentId/status', async (req: Request, res: Response) => {
  try {
    const status = await getAgentStatus(req.tenantId!, req.params['agentId']!);
    res.json({ data: status });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get status' });
  }
});

router.post('/:agentId/spawn', requireRole('trader'), async (req: Request, res: Response) => {
  if (await isKillSwitchEnabled(req.tenantId!)) {
    res.status(503).json({ error: 'Kill switch is active' });
    return;
  }
  try {
    await spawnAgent(
      req.tenantId!,
      req.params['agentId']!,
      req.body.run_id as string,
      (req.body.config as Record<string, unknown>) ?? {}
    );
    res.json({ message: 'Agent spawned' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to spawn agent' });
  }
});

router.post('/:agentId/terminate', requireRole('trader'), async (req: Request, res: Response) => {
  try {
    await terminateAgent(req.tenantId!, req.params['agentId']!);
    res.json({ message: 'Agent terminated' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to terminate agent' });
  }
});

export default router;
