import { getSupabaseAdmin } from './supabase';
import { logAudit } from './auditService';
import type { Agent } from '@cheggie/shared';

export async function isKillSwitchEnabled(tenantId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('tenants')
    .select('kill_switch_enabled')
    .eq('id', tenantId)
    .single();
  return data?.kill_switch_enabled ?? false;
}

export async function setKillSwitch(tenantId: string, enabled: boolean, userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('tenants')
    .update({ kill_switch_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', tenantId);
  if (error) throw new Error(`Failed to update kill switch: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: enabled ? 'kill_switch.enabled' : 'kill_switch.disabled',
    resource_type: 'tenant',
    resource_id: tenantId,
    new_value: { kill_switch_enabled: enabled },
  });
}

export async function createAgent(tenantId: string, userId: string, data: Partial<Agent>): Promise<Agent> {
  const admin = getSupabaseAdmin();
  const { data: agent, error } = await admin
    .from('agents')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      type: data.type,
      config: data.config ?? {},
      model_policy: data.model_policy ?? { allowed_models: [], default_model: 'gpt-4o-mini' },
      tool_allowlist: data.tool_allowlist ?? [],
      created_by: userId,
    })
    .select('*')
    .single();
  if (error) throw new Error(`Failed to create agent: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'agent.created',
    resource_type: 'agent',
    resource_id: agent.id,
    new_value: { name: agent.name, type: agent.type },
  });
  return agent as Agent;
}

export async function getAgent(tenantId: string, agentId: string): Promise<Agent> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !data) throw new Error('Agent not found');
  return data as Agent;
}

export async function listAgents(tenantId: string): Promise<Agent[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('agents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list agents: ${error.message}`);
  return (data ?? []) as Agent[];
}

export async function updateAgent(
  tenantId: string,
  agentId: string,
  userId: string,
  updates: Partial<Agent>
): Promise<Agent> {
  const admin = getSupabaseAdmin();
  const existing = await getAgent(tenantId, agentId);
  const { data, error } = await admin
    .from('agents')
    .update({ ...updates, updated_at: new Date().toISOString(), version: existing.version + 1 })
    .eq('id', agentId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error) throw new Error(`Failed to update agent: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'agent.updated',
    resource_type: 'agent',
    resource_id: agentId,
    old_value: { name: existing.name, status: existing.status },
    new_value: updates as Record<string, unknown>,
  });
  return data as Agent;
}

export async function deleteAgent(tenantId: string, agentId: string, userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const existing = await getAgent(tenantId, agentId);
  const { error } = await admin.from('agents').delete().eq('id', agentId).eq('tenant_id', tenantId);
  if (error) throw new Error(`Failed to delete agent: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'agent.deleted',
    resource_type: 'agent',
    resource_id: agentId,
    old_value: { name: existing.name },
  });
}

export async function startAgentRun(
  tenantId: string,
  agentId: string,
  userId: string
): Promise<{ run_id: string }> {
  const admin = getSupabaseAdmin();
  const agent = await getAgent(tenantId, agentId);
  if (agent.status === 'running') throw new Error('Agent is already running');
  const { data: run, error: runError } = await admin
    .from('agent_runs')
    .insert({ tenant_id: tenantId, agent_id: agentId, status: 'pending', triggered_by: userId })
    .select('id')
    .single();
  if (runError) throw new Error(`Failed to create run: ${runError.message}`);
  await admin
    .from('agents')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', agentId);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'agent.run.started',
    resource_type: 'agent_run',
    resource_id: run.id,
  });
  return { run_id: run.id };
}

export async function stopAgentRun(
  tenantId: string,
  agentId: string,
  runId: string,
  userId: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from('agent_runs')
    .update({ status: 'cancelled', completed_at: new Date().toISOString() })
    .eq('id', runId)
    .eq('tenant_id', tenantId);
  await admin
    .from('agents')
    .update({ status: 'stopped', updated_at: new Date().toISOString() })
    .eq('id', agentId);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'agent.run.stopped',
    resource_type: 'agent_run',
    resource_id: runId,
  });
}
