import { redisClient } from '@/config/redis';

export const getOrSetCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> => {
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const fresh = await fetcher();
  await redisClient.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  return fresh;
};
