import type { SSEEventType } from '@cheggie/shared';

const SSE_SERVICE_URL = process.env['SSE_SERVICE_URL'] ?? 'http://localhost:3002';
const INTERNAL_SECRET = process.env['INTERNAL_SECRET'] ?? 'dev-internal-secret';

export async function emitSSEEvent(tenantId: string, event: SSEEventType, data: unknown): Promise<void> {
  try {
    await fetch(`${SSE_SERVICE_URL}/internal/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET },
      body: JSON.stringify({ tenantId, event, data }),
    });
  } catch (err) {
    console.error('[SSEEmitter] Failed to emit event:', err instanceof Error ? err.message : 'unknown');
  }
}
