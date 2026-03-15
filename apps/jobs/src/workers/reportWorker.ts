import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '../redis';
import { emitSSEEvent } from '../sseEmitter';

interface ReportJobData {
  tenant_id: string;
  report_type: string;
  params: Record<string, unknown>;
}

const supabaseAdmin = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

async function processReport(job: Job<ReportJobData>): Promise<void> {
  const { tenant_id, report_type, params } = job.data;
  console.log(`[reportWorker] Generating ${report_type} report for tenant ${tenant_id}`);

  let reportData: Record<string, unknown> = {};

  if (report_type === 'llm_usage') {
    const { data } = await supabaseAdmin
      .from('llm_usage')
      .select('model, provider, total_tokens, cost_usd, created_at')
      .eq('tenant_id', tenant_id)
      .gte('created_at', (params['from'] as string) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    reportData = { type: 'llm_usage', data: data ?? [], generated_at: new Date().toISOString() };
  } else if (report_type === 'agent_runs') {
    const { data } = await supabaseAdmin
      .from('agent_runs')
      .select('agent_id, status, started_at, completed_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);
    reportData = { type: 'agent_runs', data: data ?? [], generated_at: new Date().toISOString() };
  }

  await emitSSEEvent(tenant_id, 'agent.log', {
    run_id: job.id ?? '',
    level: 'info',
    message: `Report ${report_type} generated`,
    metadata: reportData,
  });
}

export function startReportWorker(): Worker<ReportJobData> {
  const worker = new Worker<ReportJobData>('report-generation', processReport, {
    connection: getRedis(),
    concurrency: 2,
  });

  worker.on('completed', (job) => console.log(`[reportWorker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[reportWorker] Job ${job?.id} failed:`, err.message));

  return worker;
}
