export interface CompositionDefinition {
  id: string;
  name: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
}

export const COMPOSITION_REGISTRY: Record<string, CompositionDefinition> = {
  'trading-report': {
    id: 'trading-report',
    name: 'Trading Report',
    durationInFrames: 300,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: { title: 'Trading Report', period: '30d', data: [] },
  },
  'social-story': {
    id: 'social-story',
    name: 'Social Story',
    durationInFrames: 150,
    fps: 30,
    width: 1080,
    height: 1920,
    defaultProps: { headline: '', caption: '', brandColor: '#6366f1' },
  },
  'youtube-intro': {
    id: 'youtube-intro',
    name: 'YouTube Intro',
    durationInFrames: 90,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: { channelName: '', tagline: '', logoUrl: '' },
  },
  'blog-promo': {
    id: 'blog-promo',
    name: 'Blog Promotion',
    durationInFrames: 180,
    fps: 30,
    width: 1200,
    height: 630,
    defaultProps: { title: '', excerpt: '', thumbnailUrl: '' },
  },
};

export function getComposition(id: string): CompositionDefinition | null {
  return COMPOSITION_REGISTRY[id] ?? null;
}

export function listCompositions(): CompositionDefinition[] {
  return Object.values(COMPOSITION_REGISTRY);
}
