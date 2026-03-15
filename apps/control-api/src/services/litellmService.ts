import { getConfig } from '../config';

export interface LiteLLMCompletionRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  max_tokens?: number;
  temperature?: number;
  tenant_id: string;
  agent_id?: string;
}

export interface LiteLLMCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function litellmComplete(
  req: LiteLLMCompletionRequest
): Promise<LiteLLMCompletionResponse> {
  const config = getConfig();
  const response = await fetch(`${config.LITELLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.LITELLM_API_KEY}`,
      'x-tenant-id': req.tenant_id,
      ...(req.agent_id ? { 'x-agent-id': req.agent_id } : {}),
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      max_tokens: req.max_tokens,
      temperature: req.temperature,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LiteLLM error ${response.status}: ${errorText.slice(0, 200)}`);
  }
  return response.json() as Promise<LiteLLMCompletionResponse>;
}

export async function listLiteLLMModels(): Promise<string[]> {
  const config = getConfig();
  try {
    const response = await fetch(`${config.LITELLM_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${config.LITELLM_API_KEY}` },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { data: Array<{ id: string }> };
    return data.data.map((m) => m.id);
  } catch {
    return [];
  }
}
