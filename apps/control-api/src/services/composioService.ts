import { getConfig } from '../config';

export interface ComposioConnection {
  id: string;
  app_name: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

export async function listConnections(tenantId: string): Promise<ComposioConnection[]> {
  const config = getConfig();
  try {
    const response = await fetch(`${config.LITELLM_BASE_URL}/composio/connections`, {
      headers: {
        'x-tenant-id': tenantId,
        'x-internal-secret': config.INTERNAL_SECRET,
      },
    });
    if (!response.ok) return [];
    return response.json() as Promise<ComposioConnection[]>;
  } catch {
    return [];
  }
}

export async function initiateConnection(
  tenantId: string,
  appName: string,
  redirectUrl: string
): Promise<{ connection_url: string }> {
  const config = getConfig();
  const response = await fetch(`${config.LITELLM_BASE_URL}/composio/connections/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'x-internal-secret': config.INTERNAL_SECRET,
    },
    body: JSON.stringify({ app_name: appName, redirect_url: redirectUrl }),
  });
  if (!response.ok) throw new Error(`Composio connection error: ${response.status}`);
  return response.json() as Promise<{ connection_url: string }>;
}
