import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '../redis';
import { emitSSEEvent } from '../sseEmitter';

interface TranscriptJobData {
  tenant_id: string;
  transcript_id: string;
  video_id: string;
}

const supabaseAdmin = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

async function processTranscript(job: Job<TranscriptJobData>): Promise<void> {
  const { tenant_id, transcript_id, video_id } = job.data;
  console.log(`[transcriptWorker] Processing video ${video_id}`);

  // In production: fetch transcript from YouTube API or third-party service
  const transcript = `Transcript for video ${video_id} - processed at ${new Date().toISOString()}`;

  await supabaseAdmin
    .from('youtube_transcripts')
    .update({ transcript, processed: true })
    .eq('id', transcript_id)
    .eq('tenant_id', tenant_id);

  await emitSSEEvent(tenant_id, 'agent.log', {
    run_id: transcript_id,
    level: 'info',
    message: `Transcript processed for video ${video_id}`,
  });
}

export function startTranscriptWorker(): Worker<TranscriptJobData> {
  const worker = new Worker<TranscriptJobData>('transcript-ingestion', processTranscript, {
    connection: getRedis(),
    concurrency: 3,
  });

  worker.on('completed', (job) => console.log(`[transcriptWorker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[transcriptWorker] Job ${job?.id} failed:`, err.message));

  return worker;
}
