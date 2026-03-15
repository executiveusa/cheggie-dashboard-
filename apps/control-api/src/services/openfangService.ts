import { getConfig } from '../config';

export interface OpenFangStatus {
  agent_id: string;
  tenant_id: string;
  is_running: boolean;
  pid?: number;
  started_at?: string;
  last_heartbeat?: string;
}

export async function getAgentStatus(tenantId: string, agentId: string): Promise<OpenFangStatus> {
  const config = getConfig();
  const response = await fetch(`${config.LITELLM_BASE_URL}/openfang/status/${agentId}`, {
    headers: {
      'x-tenant-id': tenantId,
      'x-internal-secret': config.INTERNAL_SECRET,
    },
  });
  if (!response.ok) throw new Error(`OpenFang status error: ${response.status}`);
  return response.json() as Promise<OpenFangStatus>;
}

export async function spawnAgent(
  tenantId: string,
  agentId: string,
  runId: string,
  agentConfig: Record<string, unknown>
): Promise<void> {
  const appConfig = getConfig();
  const response = await fetch(`${appConfig.LITELLM_BASE_URL}/openfang/spawn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'x-internal-secret': appConfig.INTERNAL_SECRET,
    },
    body: JSON.stringify({ agent_id: agentId, run_id: runId, tenant_id: tenantId, config: agentConfig }),
  });
  if (!response.ok) throw new Error(`OpenFang spawn error: ${response.status}`);
}

export async function terminateAgent(tenantId: string, agentId: string): Promise<void> {
  const config = getConfig();
  const response = await fetch(`${config.LITELLM_BASE_URL}/openfang/terminate/${agentId}`, {
    method: 'POST',
    headers: {
      'x-tenant-id': tenantId,
      'x-internal-secret': config.INTERNAL_SECRET,
    },
  });
  if (!response.ok) throw new Error(`OpenFang terminate error: ${response.status}`);
}
