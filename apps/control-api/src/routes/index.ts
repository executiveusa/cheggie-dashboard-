import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import tenantsRouter from './tenants';
import agentsRouter from './agents';
import connectorsRouter from './connectors';
import secretsRouter from './secrets';
import approvalsRouter from './approvals';
import socialRouter from './social';
import creativeRouter from './creative';
import aiGovernanceRouter from './ai-governance';
import blogRouter from './blog';
import youtubeRouter from './youtube';
import webhooksRouter from './webhooks';
import openfangRouter from './openfang';

const router = Router();

router.use('/health', healthRouter);
router.use('/api/v1/auth', authRouter);
router.use('/api/v1/tenants', tenantsRouter);
router.use('/api/v1/agents', agentsRouter);
router.use('/api/v1/connectors', connectorsRouter);
router.use('/api/v1/secrets', secretsRouter);
router.use('/api/v1/approvals', approvalsRouter);
router.use('/api/v1/social', socialRouter);
router.use('/api/v1/creative', creativeRouter);
router.use('/api/v1/ai-governance', aiGovernanceRouter);
router.use('/api/v1/blog', blogRouter);
router.use('/api/v1/youtube', youtubeRouter);
router.use('/api/v1/webhooks', webhooksRouter);
router.use('/api/v1/openfang', openfangRouter);

export default router;
