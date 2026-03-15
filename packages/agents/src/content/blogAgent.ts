import { z } from 'zod';
import type { Agent } from '@cheggie/shared';

export const BlogAgentConfigSchema = z.object({
  niche: z.string().min(1),
  target_audience: z.string().min(1),
  writing_style: z.enum(['technical', 'conversational', 'educational', 'news']).default('educational'),
  seo_focus: z.boolean().default(true),
  min_word_count: z.number().int().min(300).default(800),
  max_word_count: z.number().int().max(10000).default(2000),
  auto_publish: z.boolean().default(false),
  require_approval: z.boolean().default(true),
  categories: z.array(z.string()).default([]),
  internal_link_min: z.number().int().min(0).default(2),
});

export type BlogAgentConfig = z.infer<typeof BlogAgentConfigSchema>;

export interface BlogOutline {
  title: string;
  slug: string;
  meta_description: string;
  h1: string;
  sections: Array<{
    heading: string;
    subheadings: string[];
    key_points: string[];
  }>;
  target_keywords: string[];
  internal_links: string[];
  estimated_word_count: number;
}

export const BLOG_AGENT_TEMPLATE = {
  name: 'Blog Agent',
  type: 'blog',
  default_config: {
    niche: '',
    target_audience: '',
    writing_style: 'educational',
    seo_focus: true,
    min_word_count: 800,
    max_word_count: 2000,
    auto_publish: false,
    require_approval: true,
    categories: [],
    internal_link_min: 2,
  } as Partial<BlogAgentConfig>,
  model_policy: {
    allowed_models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'],
    default_model: 'gpt-4o',
    max_tokens: 8192,
    temperature: 0.5,
    cost_limit_usd: 10,
  } as Agent['model_policy'],
  tool_allowlist: [
    'research_topic',
    'generate_outline',
    'write_section',
    'seo_optimize',
    'create_blog_post',
    'upload_featured_image',
  ],
};

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export function buildBlogWritingPrompt(outline: BlogOutline, config: BlogAgentConfig): string {
  return `Write a ${config.writing_style} blog post with the following specifications:

Title: ${outline.title}
Target Keywords: ${outline.target_keywords.join(', ')}
Target Audience: ${config.target_audience}
Word Count: ${config.min_word_count}-${config.max_word_count} words
SEO Focus: ${config.seo_focus ? 'Yes - optimize for search engines' : 'No'}

Outline:
${outline.sections.map((s, i) => `
${i + 1}. ${s.heading}
${s.subheadings.map((sh) => `   - ${sh}`).join('\n')}
Key Points: ${s.key_points.join(', ')}
`).join('\n')}

Requirements:
- Use proper H2/H3 headings
- Include at least ${config.internal_link_min} internal link placeholders as [INTERNAL_LINK: topic]
- Write in ${config.writing_style} style
- Include a compelling introduction and strong conclusion
- Format in Markdown`;
}
