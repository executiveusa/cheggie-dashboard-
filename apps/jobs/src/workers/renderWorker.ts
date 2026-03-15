import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '../redis';
import { emitSSEEvent } from '../sseEmitter';

interface RenderJobData {
  tenant_id: string;
  job_id: string;
  composition_id: string;
  props: Record<string, unknown>;
}

const supabaseAdmin = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

async function processRender(job: Job<RenderJobData>): Promise<void> {
  const { tenant_id, job_id, composition_id } = job.data;
  console.log(`[renderWorker] Processing render job ${job_id} for composition ${composition_id}`);

  await supabaseAdmin.from('render_jobs').update({ status: 'rendering' }).eq('id', job_id);

  for (let progress = 0; progress <= 100; progress += 10) {
    await new Promise((r) => setTimeout(r, 500));
    await supabaseAdmin.from('render_jobs').update({ progress }).eq('id', job_id);
    await emitSSEEvent(tenant_id, 'render.progress', { job_id, progress, composition_id });
    await job.updateProgress(progress);
  }

  const outputUrl = `/renders/${tenant_id}/${job_id}.mp4`;
  await supabaseAdmin.from('render_jobs').update({ status: 'done', output_url: outputUrl, progress: 100 }).eq('id', job_id);
  await emitSSEEvent(tenant_id, 'render.done', { job_id, output_url: outputUrl, composition_id });
}

export function startRenderWorker(): Worker<RenderJobData> {
  const worker = new Worker<RenderJobData>('render-pipeline', processRender, {
    connection: getRedis(),
    concurrency: 2,
  });

  worker.on('completed', (job) => console.log(`[renderWorker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[renderWorker] Job ${job?.id} failed:`, err.message));

  return worker;
}
