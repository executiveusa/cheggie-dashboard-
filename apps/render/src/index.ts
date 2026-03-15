import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { Queue, Worker, Job } from 'bullmq';
import { listCompositions, getComposition } from './compositions';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const RENDER_PORT = parseInt(process.env['RENDER_PORT'] ?? '3003', 10);
const INTERNAL_SECRET = process.env['INTERNAL_SECRET'] ?? 'dev-internal-secret';
const SSE_SERVICE_URL = process.env['SSE_SERVICE_URL'] ?? 'http://localhost:3002';
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

const supabaseAdmin = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

const redisConnection = { url: REDIS_URL, maxRetriesPerRequest: null, enableReadyCheck: false, lazyConnect: true };

const renderQueue = new Queue('render-pipeline', {
  connection: redisConnection,
  defaultJobOptions: { attempts: 2, backoff: { type: 'exponential', delay: 3000 } },
});

async function emitSSE(tenantId: string, event: string, data: unknown): Promise<void> {
  try {
    await fetch(`${SSE_SERVICE_URL}/internal/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET },
      body: JSON.stringify({ tenantId, event, data }),
    });
  } catch {
    // Non-critical
  }
}

async function executeRender(job: Job): Promise<void> {
  const { job_id, tenant_id, composition_id } = job.data as {
    job_id: string;
    tenant_id: string;
    composition_id: string;
    props: Record<string, unknown>;
  };
  const composition = getComposition(composition_id);
  if (!composition) throw new Error(`Unknown composition: ${composition_id}`);

  await supabaseAdmin.from('render_jobs').update({ status: 'rendering' }).eq('id', job_id);

  const totalFrames = composition.durationInFrames;
  for (let frame = 0; frame <= totalFrames; frame += Math.floor(totalFrames / 10)) {
    const progress = Math.round((frame / totalFrames) * 100);
    await supabaseAdmin.from('render_jobs').update({ progress }).eq('id', job_id);
    await emitSSE(tenant_id, 'render.progress', { job_id, progress, composition_id });
    await job.updateProgress(progress);
    await new Promise((r) => setTimeout(r, 200));
  }

  const storageBase = process.env['RENDER_OUTPUT_BASE_URL'] ?? 'https://storage.example.com';
  const outputUrl = `${storageBase}/renders/${tenant_id}/${job_id}.mp4`;
  await supabaseAdmin
    .from('render_jobs')
    .update({ status: 'done', output_url: outputUrl, progress: 100, updated_at: new Date().toISOString() })
    .eq('id', job_id);
  await emitSSE(tenant_id, 'render.done', { job_id, output_url: outputUrl, composition_id });
}

const renderWorker = new Worker('render-pipeline', executeRender, {
  connection: redisConnection,
  concurrency: 2,
});

renderWorker.on('failed', async (job, err) => {
  if (job) {
    const { job_id, tenant_id } = job.data as { job_id: string; tenant_id: string };
    await supabaseAdmin
      .from('render_jobs')
      .update({ status: 'failed', error: err.message, updated_at: new Date().toISOString() })
      .eq('id', job_id);
    await emitSSE(tenant_id, 'render.progress', { job_id, progress: -1, error: err.message });
  }
});

app.post('/render', async (req: Request, res: Response) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { job_id, tenant_id, composition_id, props } = req.body as {
    job_id: string;
    tenant_id: string;
    composition_id: string;
    props: Record<string, unknown>;
  };
  if (!job_id || !tenant_id || !composition_id) {
    res.status(400).json({ error: 'job_id, tenant_id, composition_id required' });
    return;
  }

  const composition = getComposition(composition_id);
  if (!composition) {
    res.status(400).json({ error: `Unknown composition: ${composition_id}` });
    return;
  }

  await renderQueue.add('render', { job_id, tenant_id, composition_id, props: props ?? {} }, { jobId: job_id });
  res.json({ queued: true, job_id });
});

app.get('/render/:jobId', async (req: Request, res: Response) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const job = await renderQueue.getJob(req.params['jobId']!);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json({ id: job.id, state: await job.getState(), progress: job.progress, data: job.data });
});

app.get('/compositions', (_req: Request, res: Response) => {
  res.json({ data: listCompositions() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(RENDER_PORT, () => {
  console.log(`[render] Listening on port ${RENDER_PORT}`);
});

process.on('SIGTERM', async () => {
  await renderWorker.close();
  server.close(() => process.exit(0));
});
