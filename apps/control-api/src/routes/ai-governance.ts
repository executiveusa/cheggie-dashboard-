import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { getSupabaseAdmin } from '../services/supabase';
import { listLiteLLMModels } from '../services/litellmService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/models', async (_req: Request, res: Response) => {
  const models = await listLiteLLMModels();
  res.json({ data: models });
});

router.get('/usage', requireRole('admin'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('llm_usage')
    .select('*')
    .eq('tenant_id', req.tenantId!)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    res.status(500).json({ error: 'Failed to fetch usage' });
    return;
  }
  res.json({ data: data ?? [] });
});

router.get('/routing-rules', requireRole('admin'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('model_routing_rules')
    .select('*')
    .eq('tenant_id', req.tenantId!)
    .order('priority', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Failed to fetch routing rules' });
    return;
  }
  res.json({ data: data ?? [] });
});

const RoutingRuleSchema = z.object({
  name: z.string().min(1),
  priority: z.number().int().default(0),
  condition: z.record(z.unknown()),
  route_to: z.string().min(1),
  fallback: z.string().optional(),
  is_active: z.boolean().default(true),
});

router.post('/routing-rules', requireRole('admin'), async (req: Request, res: Response) => {
  const parsed = RoutingRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('model_routing_rules')
    .insert({ tenant_id: req.tenantId!, ...parsed.data })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: 'Failed to create routing rule' });
    return;
  }
  res.status(201).json({ data });
});

router.delete('/routing-rules/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('model_routing_rules')
    .delete()
    .eq('id', req.params['id']!)
    .eq('tenant_id', req.tenantId!);
  if (error) {
    res.status(500).json({ error: 'Failed to delete routing rule' });
    return;
  }
  res.status(204).send();
});

export default router;
