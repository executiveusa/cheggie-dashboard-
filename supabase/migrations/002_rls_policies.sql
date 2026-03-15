-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Tenants: users can only see their own tenant
CREATE POLICY "tenants_select_own" ON public.tenants
  FOR SELECT USING (id = public.get_tenant_id());

CREATE POLICY "tenants_update_own" ON public.tenants
  FOR UPDATE USING (id = public.get_tenant_id());

-- User profiles: users see profiles in their tenant
CREATE POLICY "user_profiles_select_tenant" ON public.user_profiles
  FOR SELECT USING (tenant_id = public.get_tenant_id());

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Agents
CREATE POLICY "agents_tenant_select" ON public.agents
  FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "agents_tenant_insert" ON public.agents
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY "agents_tenant_update" ON public.agents
  FOR UPDATE USING (tenant_id = public.get_tenant_id());
CREATE POLICY "agents_tenant_delete" ON public.agents
  FOR DELETE USING (tenant_id = public.get_tenant_id());

-- Agent Runs
CREATE POLICY "agent_runs_tenant" ON public.agent_runs
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Agent Run Logs
CREATE POLICY "agent_run_logs_tenant" ON public.agent_run_logs
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Connectors
CREATE POLICY "connectors_tenant" ON public.connectors
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Secrets (select metadata only - values only via service role)
CREATE POLICY "secrets_tenant_meta" ON public.secrets
  FOR SELECT USING (tenant_id = public.get_tenant_id());

-- Audit logs (read-only for users)
CREATE POLICY "audit_logs_tenant_select" ON public.audit_logs
  FOR SELECT USING (tenant_id = public.get_tenant_id());

-- Approvals
CREATE POLICY "approvals_tenant" ON public.approvals
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Social Posts
CREATE POLICY "social_posts_tenant" ON public.social_posts
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Blog Posts
CREATE POLICY "blog_posts_tenant" ON public.blog_posts
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Render Jobs
CREATE POLICY "render_jobs_tenant" ON public.render_jobs
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- LLM Usage
CREATE POLICY "llm_usage_tenant" ON public.llm_usage
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Model Routing Rules
CREATE POLICY "model_routing_rules_tenant" ON public.model_routing_rules
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- YouTube Transcripts
CREATE POLICY "youtube_transcripts_tenant" ON public.youtube_transcripts
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- Webhook Events
CREATE POLICY "webhook_events_tenant" ON public.webhook_events
  FOR ALL USING (tenant_id = public.get_tenant_id());
