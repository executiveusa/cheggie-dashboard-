-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants(created_at);

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_tenant_id ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON public.agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON public.agents(created_at);

-- Agent Runs
CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_id ON public.agent_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON public.agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON public.agent_runs(created_at);

-- Agent Run Logs
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_run_id ON public.agent_run_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_tenant_id ON public.agent_run_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_created_at ON public.agent_run_logs(created_at);

-- Connectors
CREATE INDEX IF NOT EXISTS idx_connectors_tenant_id ON public.connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connectors_type ON public.connectors(type);
CREATE INDEX IF NOT EXISTS idx_connectors_status ON public.connectors(status);

-- Secrets
CREATE INDEX IF NOT EXISTS idx_secrets_tenant_id ON public.secrets(tenant_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Approvals
CREATE INDEX IF NOT EXISTS idx_approvals_tenant_id ON public.approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON public.approvals(created_at);

-- Social Posts
CREATE INDEX IF NOT EXISTS idx_social_posts_tenant_id ON public.social_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON public.social_posts(scheduled_at);

-- Blog Posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant_id ON public.blog_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);

-- Render Jobs
CREATE INDEX IF NOT EXISTS idx_render_jobs_tenant_id ON public.render_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON public.render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON public.render_jobs(created_at);

-- LLM Usage
CREATE INDEX IF NOT EXISTS idx_llm_usage_tenant_id ON public.llm_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_agent_id ON public.llm_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON public.llm_usage(model);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created_at ON public.llm_usage(created_at);

-- Model Routing Rules
CREATE INDEX IF NOT EXISTS idx_model_routing_rules_tenant_id ON public.model_routing_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_routing_rules_priority ON public.model_routing_rules(priority);
CREATE INDEX IF NOT EXISTS idx_model_routing_rules_active ON public.model_routing_rules(is_active);

-- YouTube Transcripts
CREATE INDEX IF NOT EXISTS idx_youtube_transcripts_tenant_id ON public.youtube_transcripts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_youtube_transcripts_video_id ON public.youtube_transcripts(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_transcripts_processed ON public.youtube_transcripts(processed);

-- Webhook Events
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_id ON public.webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON public.webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);
