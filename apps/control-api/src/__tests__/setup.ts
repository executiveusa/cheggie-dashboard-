process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SECRETS_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.INTERNAL_SECRET = 'test-internal-secret';
