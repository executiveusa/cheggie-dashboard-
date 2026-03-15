import { z } from 'zod';

export const TenantPlanSchema = z.enum(['free', 'starter', 'pro', 'enterprise']);

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  plan: TenantPlanSchema,
  kill_switch_enabled: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserRoleSchema = z.enum(['owner', 'admin', 'trader', 'viewer', 'marketing']);

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  role: UserRoleSchema,
  display_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  two_fa_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ModelPolicySchema = z.object({
  allowed_models: z.array(z.string()),
  default_model: z.string(),
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  cost_limit_usd: z.number().optional(),
});

export const AgentStatusSchema = z.enum(['idle', 'running', 'stopped', 'error']);

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  config: z.record(z.unknown()).default({}),
  model_policy: ModelPolicySchema.default({ allowed_models: [], default_model: 'gpt-4o-mini' }),
  tool_allowlist: z.array(z.string()).default([]),
});

export const UpdateAgentSchema = CreateAgentSchema.partial();

export const ConnectorTypeSchema = z.enum([
  'alpaca', 'interactive_brokers', 'td_ameritrade', 'coinbase', 'binance',
  'twitter', 'linkedin', 'instagram', 'youtube', 'custom',
]);

export const ConnectorModeSchema = z.enum(['paper', 'live']);

export const CreateConnectorSchema = z.object({
  type: ConnectorTypeSchema,
  name: z.string().min(1).max(100),
  mode: ConnectorModeSchema.default('paper'),
  config: z.record(z.unknown()).optional(),
});

export const CreateSecretSchema = z.object({
  key_name: z.string().min(1).max(100).regex(/^[A-Z_][A-Z0-9_]*$/),
  value: z.string().min(1),
});

export const CreateSocialPostSchema = z.object({
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'youtube', 'tiktok']),
  content: z.string().min(1).max(5000),
  media_urls: z.array(z.string().url()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export const CreateBlogPostSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  seo_meta: z.record(z.unknown()).default({}),
});

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial().extend({
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
});

export const CreateApprovalSchema = z.object({
  action_type: z.string().min(1),
  action_payload: z.record(z.unknown()),
  notes: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export const ApprovalActionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

export const StartRenderSchema = z.object({
  composition_id: z.string().min(1),
  props: z.record(z.unknown()).default({}),
});

export const IngestYoutubeSchema = z.object({
  video_url: z.string().url(),
  generate_summary: z.boolean().default(true),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
