import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { getSupabaseAdmin } from '../services/supabase';
import { logAudit } from '../services/auditService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/', requireRole('admin'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('tenants').select('*').eq('id', req.tenantId!);
  if (error) {
    res.status(500).json({ error: 'Failed to fetch tenant' });
    return;
  }
  res.json({ data });
});

router.patch('/', requireRole('admin'), async (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(1).max(100).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('tenants')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', req.tenantId!)
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: 'Failed to update tenant' });
    return;
  }
  await logAudit({
    tenant_id: req.tenantId!,
    user_id: req.userId!,
    action: 'tenant.updated',
    resource_type: 'tenant',
    resource_id: req.tenantId!,
    new_value: parsed.data,
  });
  res.json({ data });
});

router.get('/members', requireRole('admin'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_profiles')
    .select('id, role, display_name, avatar_url, created_at')
    .eq('tenant_id', req.tenantId!)
    .order('created_at');
  if (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
    return;
  }
  res.json({ data });
});

router.patch('/members/:userId/role', requireRole('owner'), async (req: Request, res: Response) => {
  const schema = z.object({ role: z.enum(['admin', 'trader', 'viewer', 'marketing']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('user_profiles')
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq('id', req.params['userId']!)
    .eq('tenant_id', req.tenantId!);
  if (error) {
    res.status(500).json({ error: 'Failed to update role' });
    return;
  }
  await logAudit({
    tenant_id: req.tenantId!,
    user_id: req.userId!,
    action: 'member.role.updated',
    resource_type: 'user_profile',
    resource_id: req.params['userId']!,
    new_value: parsed.data,
  });
  res.json({ message: 'Role updated' });
});

router.get('/kill-switch', async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('tenants')
    .select('kill_switch_enabled')
    .eq('id', req.tenantId!)
    .single();
  res.json({ kill_switch_enabled: data?.kill_switch_enabled ?? false });
});

router.post('/kill-switch', requireRole('owner'), async (req: Request, res: Response) => {
  const schema = z.object({ enabled: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'enabled (boolean) required' });
    return;
  }
  const admin = getSupabaseAdmin();
  await admin
    .from('tenants')
    .update({ kill_switch_enabled: parsed.data.enabled, updated_at: new Date().toISOString() })
    .eq('id', req.tenantId!);
  await logAudit({
    tenant_id: req.tenantId!,
    user_id: req.userId!,
    action: parsed.data.enabled ? 'kill_switch.enabled' : 'kill_switch.disabled',
    resource_type: 'tenant',
    resource_id: req.tenantId!,
  });
  res.json({ kill_switch_enabled: parsed.data.enabled });
});

export default router;
