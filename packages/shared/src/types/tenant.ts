export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  kill_switch_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'owner' | 'admin' | 'trader' | 'viewer' | 'marketing';

export interface UserProfile {
  id: string;
  tenant_id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  two_fa_verified: boolean;
  created_at: string;
  updated_at: string;
}
