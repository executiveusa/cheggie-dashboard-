import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '../redis';
import { emitSSEEvent } from '../sseEmitter';

interface SocialPostJobData {
  tenant_id: string;
  post_id: string;
  platform: string;
  scheduled_at: string;
}

const supabaseAdmin = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

async function processSocialPost(job: Job<SocialPostJobData>): Promise<void> {
  const { tenant_id, post_id, platform } = job.data;
  console.log(`[socialSchedulerWorker] Publishing post ${post_id} to ${platform}`);

  await supabaseAdmin
    .from('social_posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', post_id)
    .eq('tenant_id', tenant_id);

  await emitSSEEvent(tenant_id, 'social.published', {
    post_id,
    platform,
    published_at: new Date().toISOString(),
  });
}

export function startSocialSchedulerWorker(): Worker<SocialPostJobData> {
  const worker = new Worker<SocialPostJobData>('social-scheduler', processSocialPost, {
    connection: getRedis(),
    concurrency: 10,
  });

  worker.on('completed', (job) => console.log(`[socialSchedulerWorker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[socialSchedulerWorker] Job ${job?.id} failed:`, err.message));

  return worker;
}
