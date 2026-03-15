import { z } from 'zod';
import type { Agent } from '@cheggie/shared';

export const PostizOperatorAgentConfigSchema = z.object({
  platforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'])).min(1),
  posting_schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'custom']),
    times: z.array(z.string()).default(['09:00', '17:00']),
    timezone: z.string().default('UTC'),
  }),
  content_sources: z.array(z.enum(['blog', 'youtube_transcript', 'manual', 'ai_generated'])),
  require_approval: z.boolean().default(true),
  max_posts_per_day: z.number().int().min(1).max(20).default(5),
  tone: z.enum(['professional', 'casual', 'educational', 'promotional']).default('professional'),
});

export type PostizOperatorAgentConfig = z.infer<typeof PostizOperatorAgentConfigSchema>;

export interface ContentBrief {
  topic: string;
  platform: string;
  tone: string;
  key_messages: string[];
  hashtags?: string[];
  media_required: boolean;
  character_limit?: number;
}

export const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  youtube: 5000,
  tiktok: 2200,
};

export const POSTIZ_OPERATOR_TEMPLATE = {
  name: 'Postiz Operator Agent',
  type: 'social_operator',
  default_config: {
    platforms: ['linkedin'],
    posting_schedule: { frequency: 'daily', times: ['09:00'], timezone: 'UTC' },
    content_sources: ['blog', 'manual'],
    require_approval: true,
    max_posts_per_day: 3,
    tone: 'professional',
  } as Partial<PostizOperatorAgentConfig>,
  model_policy: {
    allowed_models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'],
    default_model: 'gpt-4o-mini',
    max_tokens: 2048,
    temperature: 0.7,
    cost_limit_usd: 5,
  } as Agent['model_policy'],
  tool_allowlist: [
    'create_postiz_post',
    'schedule_postiz_post',
    'get_postiz_analytics',
    'upload_media',
    'generate_hashtags',
  ],
};

export function adaptContentForPlatform(content: string, platform: string): string {
  const limit = PLATFORM_LIMITS[platform];
  if (!limit) return content;
  if (content.length <= limit) return content;
  const truncated = content.slice(0, limit - 4);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}
