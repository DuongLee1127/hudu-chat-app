import { Worker } from 'bullmq';
import { createRedisConnection } from '@/config/redis';
import pushService from '@/services/pushService';
import { logger } from '@/helpers/logger';
import type { PushJobData } from '@/queues/pushQueue';

export const startPushWorker = () => {
  const worker = new Worker<PushJobData>(
    'push-notifications',
    async (job) => {
      await pushService.sendToUser(job.data.userId, job.data.payload);
    },
    { connection: createRedisConnection('pushWorker') },
  );

  worker.on('failed', (job, error) => {
    logger.error(`pushWorker job ${job?.id} failed`, error);
  });

  return worker;
};
