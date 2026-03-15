import { Request, Response, NextFunction } from 'express';
import { verifyHmacSignature } from '@cheggie/shared';
import { getConfig } from '../config';

export function webhookVerifyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-signature-256'] as string | undefined;
  if (!signature) {
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }
  const sigValue = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
  const config = getConfig();
  const valid = verifyHmacSignature(rawBody, sigValue, config.WEBHOOK_SECRET);
  if (!valid) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }
  next();
}
