import { getConfig } from '../config';
import { getSupabaseAdmin } from './supabase';

export async function queueRenderJob(
  tenantId: string,
  compositionId: string,
  props: Record<string, unknown>,
  requestedBy: string
): Promise<{ job_id: string }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('render_jobs')
    .insert({
      tenant_id: tenantId,
      composition_id: compositionId,
      props,
      status: 'queued',
      requested_by: requestedBy,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to queue render: ${error.message}`);
  const config = getConfig();
  try {
    await fetch(`${config.RENDER_SERVICE_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': config.INTERNAL_SECRET,
      },
      body: JSON.stringify({
        job_id: data.id,
        tenant_id: tenantId,
        composition_id: compositionId,
        props,
      }),
    });
  } catch {
    // Fire and forget; render service will pick up from DB
  }
  return { job_id: data.id };
}

export async function getRenderJobStatus(tenantId: string, jobId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('render_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !data) throw new Error('Render job not found');
  return data;
}
