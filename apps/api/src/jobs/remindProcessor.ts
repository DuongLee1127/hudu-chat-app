import Remind from '@/models/remind';
import Notification from '@/models/notification';
import { getIO } from '@/socket';
import { logger } from '@/helpers/logger';
import pushService from '@/services/pushService';

export const startRemindProcessor = () => {
  const tick = async () => {
    try {
      const due = await Remind.find({ sent: false, dueAt: { $lte: new Date() } }).limit(50);
      if (due.length === 0) return;

      let io: ReturnType<typeof getIO> | null = null;
      try {
        io = getIO();
      } catch {
        io = null;
      }

      for (const remind of due) {
        const notification = await Notification.create({
          userId: remind.userId,
          content: `Nhắc nhở: ${remind.content}`,
          type: 'system',
        });
        remind.sent = true;
        await remind.save();

        const userId = String(remind.userId);
        io?.to(`user:${userId}`).emit('notification:new', { notification });
        await pushService.sendToUser(userId, {
          title: 'Nhắc nhở Hudu',
          body: remind.content,
        });
      }
    } catch (error) {
      logger.error('remind processor failed', error);
    }
  };

  setInterval(tick, 60 * 1000);
  tick();
};
