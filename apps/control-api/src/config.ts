import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SECRETS_ENCRYPTION_KEY: z.string().length(64).regex(/^[a-f0-9]{64}$/i, 'Must be 64 hex characters'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  WEBHOOK_SECRET: z.string().min(1),
  LITELLM_BASE_URL: z.string().url().default('http://localhost:4000'),
  LITELLM_API_KEY: z.string().default(''),
  POSTIZ_API_URL: z.string().url().default('http://localhost:3002'),
  POSTIZ_API_KEY: z.string().default(''),
  REMOTION_SERVE_URL: z.string().url().default('http://localhost:3004'),
  INTERNAL_SECRET: z.string().min(1).default('dev-internal-secret'),
  SSE_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  RENDER_SERVICE_URL: z.string().url().default('http://localhost:3003'),
});

type Config = z.infer<typeof ConfigSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid configuration: ${missing}`);
  }
  _config = result.data;
  return _config;
}

export type { Config };
