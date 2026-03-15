import { z } from 'zod';
import type { Agent } from '@cheggie/shared';

export const YoutubeTranscriptAgentConfigSchema = z.object({
  channel_urls: z.array(z.string().url()).min(1),
  keywords: z.array(z.string()).optional(),
  auto_summarize: z.boolean().default(true),
  auto_tag: z.boolean().default(true),
  generate_blog_post: z.boolean().default(false),
  publish_to_social: z.boolean().default(false),
  cron_schedule: z.string().regex(
    /^(\*|([0-5]?\d))(\/\d+)?\s+(\*|([01]?\d|2[0-3]))(\/\d+)?\s+(\*|([12]?\d|3[01]))(\/\d+)?\s+(\*|(1[0-2]|[1-9]))(\/\d+)?\s+(\*|[0-6])(\/\d+)?$/,
    'Invalid cron expression'
  ).default('0 */6 * * *'),
  max_videos_per_run: z.number().int().min(1).max(50).default(10),
});

export type YoutubeTranscriptAgentConfig = z.infer<typeof YoutubeTranscriptAgentConfigSchema>;

export interface TranscriptAnalysis {
  video_id: string;
  title: string;
  channel: string;
  summary: string;
  key_points: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  suggested_blog_title?: string;
  suggested_social_post?: string;
}

export const YOUTUBE_TRANSCRIPT_AGENT_TEMPLATE = {
  name: 'YouTube Transcript Agent',
  type: 'youtube_transcript',
  default_config: {
    channel_urls: [],
    auto_summarize: true,
    auto_tag: true,
    generate_blog_post: false,
    publish_to_social: false,
    cron_schedule: '0 */6 * * *',
    max_videos_per_run: 10,
  } as Partial<YoutubeTranscriptAgentConfig>,
  model_policy: {
    allowed_models: ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku-20240307'],
    default_model: 'gpt-4o-mini',
    max_tokens: 8192,
    temperature: 0.3,
    cost_limit_usd: 5,
  } as Agent['model_policy'],
  tool_allowlist: [
    'fetch_youtube_transcript',
    'summarize_text',
    'extract_tags',
    'create_blog_post',
    'schedule_social_post',
  ],
};

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] ?? null;
  }
  return null;
}

export function buildSummaryPrompt(transcript: string, title: string): string {
  return `Analyze the following YouTube video transcript titled "${title}" and provide:
1. A concise 2-3 paragraph summary
2. 5-7 key bullet points
3. Overall sentiment (positive/negative/neutral)
4. 5-10 relevant tags

Transcript:
${transcript.slice(0, 8000)}

Respond in JSON format with keys: summary, key_points, sentiment, tags`;
}
