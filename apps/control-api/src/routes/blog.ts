import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { CreateBlogPostSchema, UpdateBlogPostSchema } from '@cheggie/shared';
import {
  createBlogPost,
  listBlogPosts,
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../services/blogService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/', async (req: Request, res: Response) => {
  const querySchema = z.object({ status: z.string().optional() });
  const { status } = querySchema.parse(req.query);
  try {
    const posts = await listBlogPosts(req.tenantId!, status);
    res.json({ data: posts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list blog posts' });
  }
});

router.post('/', requireRole('marketing'), async (req: Request, res: Response) => {
  const parsed = CreateBlogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const post = await createBlogPost(req.tenantId!, req.userId!, parsed.data);
    res.status(201).json({ data: post });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create blog post' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await getBlogPost(req.tenantId!, req.params['id']!);
    res.json({ data: post });
  } catch {
    res.status(404).json({ error: 'Blog post not found' });
  }
});

router.patch('/:id', requireRole('marketing'), async (req: Request, res: Response) => {
  const parsed = UpdateBlogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const post = await updateBlogPost(req.tenantId!, req.params['id']!, req.userId!, parsed.data);
    res.json({ data: post });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update blog post' });
  }
});

router.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await deleteBlogPost(req.tenantId!, req.params['id']!, req.userId!);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete blog post' });
  }
});

export default router;
