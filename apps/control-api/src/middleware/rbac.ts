import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@cheggie/shared';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 100,
  admin: 80,
  trader: 60,
  marketing: 40,
  viewer: 20,
};

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.userProfile?.role;
    if (!userRole) {
      res.status(403).json({ error: 'No role assigned' });
      return;
    }
    const minRequired = Math.min(...roles.map((r) => ROLE_HIERARCHY[r]));
    if (ROLE_HIERARCHY[userRole] < minRequired) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireExactRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.userProfile?.role;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
