import { RedisOptions } from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

export function getRedis(): RedisOptions & { url: string } {
  return {
    url: REDIS_URL,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  } as unknown as RedisOptions & { url: string };
}
