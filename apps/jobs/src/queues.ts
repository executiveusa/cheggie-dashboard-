import { Queue, QueueOptions } from 'bullmq';
import { getRedis } from './redis';

const queueOptions: Partial<QueueOptions> = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
};

let _queues: Record<string, Queue> | null = null;

export function getQueues(): Record<string, Queue> {
  if (_queues) return _queues;
  const connection = getRedis();
  _queues = {
    'agent-runs': new Queue('agent-runs', { connection, ...queueOptions }),
    'transcript-ingestion': new Queue('transcript-ingestion', { connection, ...queueOptions }),
    'render-pipeline': new Queue('render-pipeline', { connection, ...queueOptions }),
    'report-generation': new Queue('report-generation', { connection, ...queueOptions }),
    'social-scheduler': new Queue('social-scheduler', { connection, ...queueOptions }),
  };
  return _queues;
}

export async function enqueueAgentRun(payload: { tenant_id: string; agent_id: string; run_id: string; config: Record<string, unknown> }): Promise<void> {
  const queues = getQueues();
  await queues['agent-runs']!.add('run', payload, { jobId: payload.run_id });
}

export async function enqueueTranscriptIngestion(payload: { tenant_id: string; transcript_id: string; video_id: string }): Promise<void> {
  const queues = getQueues();
  await queues['transcript-ingestion']!.add('ingest', payload);
}

export async function enqueueRenderJob(payload: { tenant_id: string; job_id: string; composition_id: string; props: Record<string, unknown> }): Promise<void> {
  const queues = getQueues();
  await queues['render-pipeline']!.add('render', payload, { jobId: payload.job_id });
}

export async function enqueueReportGeneration(payload: { tenant_id: string; report_type: string; params: Record<string, unknown> }): Promise<void> {
  const queues = getQueues();
  await queues['report-generation']!.add('report', payload);
}

export async function enqueueSocialPost(payload: { tenant_id: string; post_id: string; platform: string; scheduled_at: string }): Promise<void> {
  const queues = getQueues();
  const delay = Math.max(0, new Date(payload.scheduled_at).getTime() - Date.now());
  await queues['social-scheduler']!.add('publish', payload, { delay, jobId: `social-${payload.post_id}` });
}
