import { Request, Response, NextFunction } from 'express';

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    res.status(403).json({ error: 'No tenant associated with this account' });
    return;
  }
  next();
}
