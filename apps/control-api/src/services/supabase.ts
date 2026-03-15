import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const config = getConfig();
    _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const config = getConfig();
    _supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _supabaseAdmin;
}

export async function verifyJWT(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, email: data.user.email ?? '' };
  } catch {
    return null;
  }
}
