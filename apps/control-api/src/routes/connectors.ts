import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { CreateConnectorSchema } from '@cheggie/shared';
import { getSupabaseAdmin } from '../services/supabase';
import { encrypt } from '@cheggie/shared';
import { getConfig } from '../config';
import { logAudit } from '../services/auditService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/', async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('connectors')
    .select('id, tenant_id, type, name, mode, status, created_by, created_at, updated_at')
    .eq('tenant_id', req.tenantId!)
    .order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Failed to list connectors' });
    return;
  }
  res.json({ data: data ?? [] });
});

router.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  const parsed = CreateConnectorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  const config = getConfig();
  const encrypted = parsed.data.config
    ? encrypt(JSON.stringify(parsed.data.config), config.SECRETS_ENCRYPTION_KEY)
    : null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('connectors')
    .insert({
      tenant_id: req.tenantId!,
      type: parsed.data.type,
      name: parsed.data.name,
      mode: parsed.data.mode,
      config_encrypted: encrypted,
      created_by: req.userId!,
    })
    .select('id, type, name, mode, status, created_at')
    .single();
  if (error) {
    res.status(500).json({ error: 'Failed to create connector' });
    return;
  }
  await logAudit({
    tenant_id: req.tenantId!,
    user_id: req.userId!,
    action: 'connector.created',
    resource_type: 'connector',
    resource_id: data.id,
    new_value: { type: parsed.data.type, name: parsed.data.name },
  });
  res.status(201).json({ data });
});

router.get('/:id', async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('connectors')
    .select('id, type, name, mode, status, created_at')
    .eq('id', req.params['id']!)
    .eq('tenant_id', req.tenantId!)
    .single();
  if (error || !data) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }
  res.json({ data });
});

router.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('connectors')
    .delete()
    .eq('id', req.params['id']!)
    .eq('tenant_id', req.tenantId!);
  if (error) {
    res.status(500).json({ error: 'Failed to delete connector' });
    return;
  }
  await logAudit({
    tenant_id: req.tenantId!,
    user_id: req.userId!,
    action: 'connector.deleted',
    resource_type: 'connector',
    resource_id: req.params['id']!,
  });
  res.status(204).send();
});

export default router;
