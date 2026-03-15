import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '../redis';
import { emitSSEEvent } from '../sseEmitter';

interface AgentRunJobData {
  tenant_id: string;
  agent_id: string;
  run_id: string;
  config: Record<string, unknown>;
}

const supabaseAdmin = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

async function processAgentRun(job: Job<AgentRunJobData>): Promise<void> {
  const { tenant_id, agent_id, run_id, config: _config } = job.data;
  console.log(`[agentRunWorker] Processing run ${run_id} for agent ${agent_id}`);

  await supabaseAdmin.from('agent_runs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', run_id);
  await emitSSEEvent(tenant_id, 'agent.started', { agent_id, run_id });

  try {
    await job.log(`Agent run ${run_id} started`);

    // Poll for completion - in production this would interact with the runtime
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      await job.updateProgress((i + 1) * 20);
      await emitSSEEvent(tenant_id, 'agent.log', { run_id, level: 'info', message: `Step ${i + 1}/5 completed` });
    }

    await supabaseAdmin.from('agent_runs').update({ status: 'completed', completed_at: new Date().toISOString(), output: { message: 'Completed successfully' } }).eq('id', run_id);
    await supabaseAdmin.from('agents').update({ status: 'idle', updated_at: new Date().toISOString() }).eq('id', agent_id);
    await emitSSEEvent(tenant_id, 'run.completed', { run_id, agent_id, status: 'completed' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await supabaseAdmin.from('agent_runs').update({ status: 'failed', completed_at: new Date().toISOString(), error: errorMsg }).eq('id', run_id);
    await supabaseAdmin.from('agents').update({ status: 'error', updated_at: new Date().toISOString() }).eq('id', agent_id);
    await emitSSEEvent(tenant_id, 'run.completed', { run_id, agent_id, status: 'failed', error: errorMsg });
    throw err;
  }
}

export function startAgentRunWorker(): Worker<AgentRunJobData> {
  const worker = new Worker<AgentRunJobData>('agent-runs', processAgentRun, {
    connection: getRedis(),
    concurrency: 5,
  });

  worker.on('completed', (job) => console.log(`[agentRunWorker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[agentRunWorker] Job ${job?.id} failed:`, err.message));

  return worker;
}
