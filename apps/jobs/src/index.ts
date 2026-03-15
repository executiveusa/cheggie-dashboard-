import { startAgentRunWorker } from './workers/agentRunWorker';
import { startTranscriptWorker } from './workers/transcriptWorker';
import { startRenderWorker } from './workers/renderWorker';
import { startSocialSchedulerWorker } from './workers/socialSchedulerWorker';
import { startReportWorker } from './workers/reportWorker';

console.log('[jobs] Starting BullMQ workers...');

const workers = [
  startAgentRunWorker(),
  startTranscriptWorker(),
  startRenderWorker(),
  startSocialSchedulerWorker(),
  startReportWorker(),
];

console.log(`[jobs] ${workers.length} workers started`);

async function shutdown(): Promise<void> {
  console.log('[jobs] Shutting down workers...');
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
