export type AgentStatus = 'idle' | 'running' | 'stopped' | 'error';
export type AgentRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ModelPolicy {
  allowed_models: string[];
  default_model: string;
  max_tokens?: number;
  temperature?: number;
  cost_limit_usd?: number;
}

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  status: AgentStatus;
  config: Record<string, unknown>;
  model_policy: ModelPolicy;
  tool_allowlist: string[];
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  tenant_id: string;
  agent_id: string;
  status: AgentRunStatus;
  started_at: string | null;
  completed_at: string | null;
  output: Record<string, unknown> | null;
  error: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface AgentRunLog {
  id: string;
  tenant_id: string;
  run_id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
