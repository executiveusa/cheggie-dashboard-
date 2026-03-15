import { getSupabaseAdmin } from './supabase';
import { logAudit } from './auditService';

export interface ApprovalRequest {
  tenant_id: string;
  requested_by: string;
  action_type: string;
  action_payload: Record<string, unknown>;
  notes?: string;
  expires_at?: string;
}

export async function createApproval(req: ApprovalRequest): Promise<{ id: string }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('approvals')
    .insert({
      tenant_id: req.tenant_id,
      requested_by: req.requested_by,
      action_type: req.action_type,
      action_payload: req.action_payload,
      notes: req.notes ?? null,
      expires_at: req.expires_at ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create approval: ${error.message}`);
  return { id: data.id };
}

export async function processApproval(
  tenantId: string,
  approvalId: string,
  approverId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await admin
    .from('approvals')
    .select('*')
    .eq('id', approvalId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .single();
  if (fetchError || !existing) throw new Error('Approval not found or already processed');

  const expiresAt = existing.expires_at ? new Date(existing.expires_at) : null;
  if (expiresAt && expiresAt < new Date()) throw new Error('Approval request has expired');

  const { error } = await admin
    .from('approvals')
    .update({
      status,
      approved_by: approverId,
      notes: notes ?? existing.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalId);
  if (error) throw new Error(`Failed to process approval: ${error.message}`);

  await logAudit({
    tenant_id: tenantId,
    user_id: approverId,
    action: `approval.${status}`,
    resource_type: 'approval',
    resource_id: approvalId,
    old_value: { status: 'pending' },
    new_value: { status, approved_by: approverId },
  });
}

export async function getApproval(tenantId: string, approvalId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('approvals')
    .select('*')
    .eq('id', approvalId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !data) throw new Error('Approval not found');
  return data;
}

export async function listApprovals(tenantId: string, status?: string) {
  const admin = getSupabaseAdmin();
  let query = admin
    .from('approvals')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list approvals: ${error.message}`);
  return data ?? [];
}
