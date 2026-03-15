import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { CreateSocialPostSchema } from '@cheggie/shared';
import { getSupabaseAdmin } from '../services/supabase';
import { schedulePost } from '../services/postizService';
import { logAudit } from '../services/auditService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/posts', async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('social_posts')
    .select('*')
    .eq('tenant_id', req.tenantId!)
    .order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Failed to list posts' });
    return;
  }
  res.json({ data: data ?? [] });
});

router.post('/posts', requireRole('marketing'), async (req: Request, res: Response) => {
  const parsed = CreateSocialPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  const admin = getSupabaseAdmin();
  try {
    const postizResult = await schedulePost(req.tenantId!, {
      platform: parsed.data.platform,
      content: parsed.data.content,
      media_urls: parsed.data.media_urls,
      scheduled_at: parsed.data.scheduled_at,
    });
    const { data, error } = await admin
      .from('social_posts')
      .insert({
        tenant_id: req.tenantId!,
        platform: parsed.data.platform,
        content: parsed.data.content,
        media_urls: parsed.data.media_urls ?? [],
        scheduled_at: parsed.data.scheduled_at ?? null,
        status: parsed.data.scheduled_at ? 'scheduled' : 'pending_approval',
        postiz_post_id: postizResult.id,
        created_by: req.userId!,
      })
      .select('*')
      .single();
    if (error) throw error;
    await logAudit({
      tenant_id: req.tenantId!,
      user_id: req.userId!,
      action: 'social.post.created',
      resource_type: 'social_post',
      resource_id: data.id,
    });
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create post' });
  }
});

router.delete('/posts/:id', requireRole('marketing'), async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('social_posts')
    .delete()
    .eq('id', req.params['id']!)
    .eq('tenant_id', req.tenantId!);
  if (error) {
    res.status(500).json({ error: 'Failed to delete post' });
    return;
  }
  res.status(204).send();
});

export default router;
