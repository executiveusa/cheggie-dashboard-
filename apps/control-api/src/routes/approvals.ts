import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { CreateApprovalSchema, ApprovalActionSchema } from '@cheggie/shared';
import {
  createApproval,
  processApproval,
  getApproval,
  listApprovals,
} from '../services/approvalService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/', async (req: Request, res: Response) => {
  const querySchema = z.object({ status: z.string().optional() });
  const { status } = querySchema.parse(req.query);
  try {
    const approvals = await listApprovals(req.tenantId!, status);
    res.json({ data: approvals });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list approvals' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateApprovalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const result = await createApproval({
      tenant_id: req.tenantId!,
      requested_by: req.userId!,
      ...parsed.data,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create approval' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const approval = await getApproval(req.tenantId!, req.params['id']!);
    res.json({ data: approval });
  } catch {
    res.status(404).json({ error: 'Approval not found' });
  }
});

router.post('/:id/action', requireRole('admin'), async (req: Request, res: Response) => {
  const parsed = ApprovalActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    await processApproval(
      req.tenantId!,
      req.params['id']!,
      req.userId!,
      parsed.data.status,
      parsed.data.notes
    );
    res.json({ message: `Approval ${parsed.data.status}` });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to process approval' });
  }
});

export default router;
