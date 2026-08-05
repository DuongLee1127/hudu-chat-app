import { redisClient } from '@/config/redis';

const onlineKey = (userId: string) => `online:${userId}`;

export const addUserSocket = async (userId: string, socketId: string) => {
  const before = await redisClient.scard(onlineKey(userId));
  await redisClient.sadd(onlineKey(userId), socketId);
  return { wasOffline: before === 0 };
};

export const removeUserSocket = async (userId: string, socketId: string) => {
  await redisClient.srem(onlineKey(userId), socketId);
  const remaining = await redisClient.scard(onlineKey(userId));
  return { isNowOffline: remaining === 0 };
};

export const isUserOnline = async (userId: string) => {
  const count = await redisClient.scard(onlineKey(userId));
  return count > 0;
};
