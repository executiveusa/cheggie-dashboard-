import { Request, Response, NextFunction } from 'express';
import { logAudit } from '../services/auditService';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.includes(req.method)) return next();
  res.on('finish', () => {
    if (req.tenantId && req.userId && res.statusCode < 400) {
      const parts = req.path.split('/').filter(Boolean);
      const resourceType = parts[2] ?? parts[1] ?? 'unknown';
      const resourceId = parts[3] ?? undefined;
      logAudit({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: `${req.method.toLowerCase()}.${resourceType}`,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      }).catch(() => undefined);
    }
  });
  next();
}
