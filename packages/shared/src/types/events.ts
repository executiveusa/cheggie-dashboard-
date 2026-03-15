export type SSEEventType =
  | 'agent.started'
  | 'agent.stopped'
  | 'agent.log'
  | 'run.completed'
  | 'approval.required'
  | 'render.progress'
  | 'render.done'
  | 'social.published'
  | 'webhook.received'
  | 'heartbeat';

export interface SSEEvent<T = unknown> {
  id: string;
  event: SSEEventType;
  data: T;
  tenant_id: string;
  timestamp: string;
}

export interface AgentStartedPayload {
  agent_id: string;
  run_id: string;
  agent_name: string;
}

export interface AgentLogPayload {
  run_id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface RunCompletedPayload {
  run_id: string;
  agent_id: string;
  status: 'completed' | 'failed';
  output?: Record<string, unknown>;
  error?: string;
}

export interface ApprovalRequiredPayload {
  approval_id: string;
  action_type: string;
  requested_by: string;
  expires_at: string;
}

export interface RenderProgressPayload {
  job_id: string;
  progress: number;
  composition_id: string;
}

export interface RenderDonePayload {
  job_id: string;
  output_url: string;
  composition_id: string;
}
