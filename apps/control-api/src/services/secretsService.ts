import { encrypt, decrypt } from '@cheggie/shared';
import { getSupabaseAdmin } from './supabase';
import { getConfig } from '../config';

export async function storeSecret(
  tenantId: string,
  keyName: string,
  value: string,
  createdBy: string
): Promise<{ id: string }> {
  const config = getConfig();
  const encrypted = encrypt(value, config.SECRETS_ENCRYPTION_KEY);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('secrets')
    .upsert(
      { tenant_id: tenantId, key_name: keyName, encrypted_value: encrypted, created_by: createdBy },
      { onConflict: 'tenant_id,key_name' }
    )
    .select('id')
    .single();
  if (error) throw new Error(`Failed to store secret: ${error.message}`);
  return { id: data.id };
}

export async function getSecret(tenantId: string, keyName: string): Promise<string | null> {
  const config = getConfig();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('secrets')
    .select('encrypted_value')
    .eq('tenant_id', tenantId)
    .eq('key_name', keyName)
    .single();
  if (error || !data) return null;
  return decrypt(data.encrypted_value, config.SECRETS_ENCRYPTION_KEY);
}

export async function listSecretKeys(
  tenantId: string
): Promise<Array<{ id: string; key_name: string; created_at: string }>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('secrets')
    .select('id, key_name, created_at')
    .eq('tenant_id', tenantId)
    .order('key_name');
  if (error) throw new Error(`Failed to list secrets: ${error.message}`);
  return data ?? [];
}

export async function deleteSecret(tenantId: string, keyName: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('secrets')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('key_name', keyName);
  if (error) throw new Error(`Failed to delete secret: ${error.message}`);
}
