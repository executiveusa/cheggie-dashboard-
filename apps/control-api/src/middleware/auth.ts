import { Request, Response, NextFunction } from 'express';
import { verifyJWT, getSupabaseAdmin } from '../services/supabase';
import type { UserProfile } from '@cheggie/shared';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userProfile?: UserProfile;
      tenantId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  const user = await verifyJWT(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.userId = user.userId;
  req.userEmail = user.email;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', user.userId)
    .single();
  if (profile) {
    req.userProfile = profile as UserProfile;
    req.tenantId = profile.tenant_id;
  }
  next();
}
