import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { CreateAgentSchema, UpdateAgentSchema } from '@cheggie/shared';
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  deleteAgent,
  startAgentRun,
  stopAgentRun,
  isKillSwitchEnabled,
} from '../services/agentService';
import { getSupabaseAdmin } from '../services/supabase';

const router = Router();
router.use(authMiddleware, requireTenant);

async function checkKillSwitch(req: Request, res: Response): Promise<boolean> {
  const enabled = await isKillSwitchEnabled(req.tenantId!);
  if (enabled) {
    res.status(503).json({ error: 'System is in kill switch mode. Agent operations are disabled.' });
    return true;
  }
  return false;
}

/**
 * @openapi
 * /api/v1/agents:
 *   get:
 *     summary: List all agents for the tenant
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agents
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const agents = await listAgents(req.tenantId!);
    res.json({ data: agents });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list agents' });
  }
});

/**
 * @openapi
 * /api/v1/agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Agent created
 */
router.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  if (await checkKillSwitch(req, res)) return;
  const parsed = CreateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const agent = await createAgent(req.tenantId!, req.userId!, parsed.data);
    res.status(201).json({ data: agent });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create agent' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agent = await getAgent(req.tenantId!, req.params['id']!);
    res.json({ data: agent });
  } catch {
    res.status(404).json({ error: 'Agent not found' });
  }
});

router.patch('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const parsed = UpdateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const agent = await updateAgent(req.tenantId!, req.params['id']!, req.userId!, parsed.data);
    res.json({ data: agent });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update agent' });
  }
});

router.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await deleteAgent(req.tenantId!, req.params['id']!, req.userId!);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete agent' });
  }
});

router.post('/:id/start', requireRole('trader'), async (req: Request, res: Response) => {
  if (await checkKillSwitch(req, res)) return;
  try {
    const result = await startAgentRun(req.tenantId!, req.params['id']!, req.userId!);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to start agent' });
  }
});

router.post('/:id/stop', requireRole('trader'), async (req: Request, res: Response) => {
  const stopSchema = z.object({ run_id: z.string().uuid() });
  const parsed = stopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'run_id (UUID) required' });
    return;
  }
  try {
    await stopAgentRun(req.tenantId!, req.params['id']!, parsed.data.run_id, req.userId!);
    res.json({ message: 'Agent stopped' });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to stop agent' });
  }
});

router.get('/:id/runs', async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('agent_runs')
    .select('*')
    .eq('agent_id', req.params['id']!)
    .eq('tenant_id', req.tenantId!)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    res.status(500).json({ error: 'Failed to fetch runs' });
    return;
  }
  res.json({ data: data ?? [] });
});

router.get('/:id/runs/:runId/logs', async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('agent_run_logs')
    .select('*')
    .eq('run_id', req.params['runId']!)
    .eq('tenant_id', req.tenantId!)
    .order('created_at')
    .limit(500);
  if (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
    return;
  }
  res.json({ data: data ?? [] });
});

export default router;
