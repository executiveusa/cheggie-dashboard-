import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface SSEClient {
  id: string;
  userId: string;
  tenantId: string;
  response: Response;
  lastEventId: string | null;
  connectedAt: Date;
}

class ChannelMap {
  private channels: Map<string, Map<string, SSEClient>> = new Map();

  addClient(tenantId: string, client: Omit<SSEClient, 'id'>): SSEClient {
    const id = uuidv4();
    const fullClient: SSEClient = { ...client, id };
    if (!this.channels.has(tenantId)) {
      this.channels.set(tenantId, new Map());
    }
    this.channels.get(tenantId)!.set(id, fullClient);
    return fullClient;
  }

  removeClient(tenantId: string, clientId: string): void {
    this.channels.get(tenantId)?.delete(clientId);
    if (this.channels.get(tenantId)?.size === 0) {
      this.channels.delete(tenantId);
    }
  }

  getClients(tenantId: string): SSEClient[] {
    return Array.from(this.channels.get(tenantId)?.values() ?? []);
  }

  getTenantCount(tenantId: string): number {
    return this.channels.get(tenantId)?.size ?? 0;
  }

  getTotalCount(): number {
    let total = 0;
    for (const clients of this.channels.values()) total += clients.size;
    return total;
  }

  broadcast(tenantId: string, eventId: string, event: string, data: unknown): void {
    const clients = this.getClients(tenantId);
    const payload = `id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      try {
        client.response.write(payload);
      } catch {
        this.removeClient(tenantId, client.id);
      }
    }
  }
}

export const channelMap = new ChannelMap();
