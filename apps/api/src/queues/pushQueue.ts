import { Queue } from 'bullmq';
import { createRedisConnection } from '@/config/redis';

export interface PushJobData {
  userId: string;
  payload: { title: string; body: string; link?: string };
}

export const pushQueue = new Queue<PushJobData>('push-notifications', {
  connection: createRedisConnection('pushQueue'),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
