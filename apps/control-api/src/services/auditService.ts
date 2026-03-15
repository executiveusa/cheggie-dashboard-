import { getSupabaseAdmin } from './supabase';

export interface AuditLogEntry {
  tenant_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from('audit_logs').insert({
      tenant_id: entry.tenant_id,
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      old_value: entry.old_value ?? null,
      new_value: entry.new_value ?? null,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
    });
  } catch (err) {
    console.error('[AuditService] Failed to write audit log:', err instanceof Error ? err.message : 'unknown');
  }
}
