import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { CreateSecretSchema } from '@cheggie/shared';
import { storeSecret, listSecretKeys, deleteSecret } from '../services/secretsService';

const router = Router();
router.use(authMiddleware, requireTenant, requireRole('admin'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const keys = await listSecretKeys(req.tenantId!);
    res.json({ data: keys });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list secrets' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateSecretSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const result = await storeSecret(req.tenantId!, parsed.data.key_name, parsed.data.value, req.userId!);
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to store secret' });
  }
});

router.delete('/:keyName', async (req: Request, res: Response) => {
  try {
    await deleteSecret(req.tenantId!, req.params['keyName']!);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete secret' });
  }
});

export default router;
