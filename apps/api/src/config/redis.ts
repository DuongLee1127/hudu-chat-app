import Redis from 'ioredis';
import { logger } from '@/helpers/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Slower backoff so a down Redis doesn't flood the console with retry errors.
const retryStrategy = (times: number) => Math.min(times * 500, 10000);

export const attachErrorHandler = (client: Redis, label: string) => {
  let hasWarned = false;
  client.on('error', (error) => {
    if (!hasWarned) {
      hasWarned = true;
      logger.error(`${label} connection error (will keep retrying)`, error);
    }
  });
  client.on('connect', () => {
    hasWarned = false;
  });
  return client;
};

export const redisClient = attachErrorHandler(
  new Redis(REDIS_URL, { retryStrategy }),
  'redisClient',
);

// BullMQ requires its own connection with maxRetriesPerRequest disabled.
export const createRedisConnection = (label = 'bullmq') =>
  attachErrorHandler(
    new Redis(REDIS_URL, { maxRetriesPerRequest: null, retryStrategy }),
    label,
  );
