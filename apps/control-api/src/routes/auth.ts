import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../services/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const SignUpSchema = SignInSchema.extend({
  display_name: z.string().min(1).optional(),
});

/**
 * @openapi
 * /api/v1/auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post('/signin', async (req: Request, res: Response) => {
  const parsed = SignInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user: { id: data.user?.id, email: data.user?.email },
  });
});

/**
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     summary: Sign up with email and password
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Invalid input or email already in use
 */
router.post('/signup', async (req: Request, res: Response) => {
  const parsed = SignUpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(201).json({
    user: { id: data.user?.id, email: data.user?.email },
    message: 'Check your email for verification',
  });
});

router.post('/signout', authMiddleware, async (req: Request, res: Response) => {
  const supabase = getSupabase();
  await supabase.auth.signOut().catch(() => undefined);
  res.json({ message: 'Signed out' });
});

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: { id: req.userId, email: req.userEmail, profile: req.userProfile } });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const schema = z.object({ refresh_token: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'refresh_token required' });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: parsed.data.refresh_token,
  });
  if (error || !data.session) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }
  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

export default router;
