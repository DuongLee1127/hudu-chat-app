import webpush from 'web-push';
import User from '@/models/user';
import { logger } from '@/helpers/logger';

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:admin@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

interface PushPayload {
  title: string;
  body: string;
  link?: string;
}

const pushService = {
  isConfigured: () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),

  saveSubscription: async (
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) => {
    await User.updateOne(
      { _id: userId, 'pushSubscriptions.endpoint': { $ne: subscription.endpoint } },
      { $push: { pushSubscriptions: subscription } },
    );
    return { success: true };
  },

  removeSubscription: async (userId: string, endpoint: string) => {
    await User.updateOne({ _id: userId }, { $pull: { pushSubscriptions: { endpoint } } });
    return { success: true };
  },

  sendToUser: async (userId: string, payload: PushPayload) => {
    if (!pushService.isConfigured()) return;

    const user = await User.findById(userId).select('+pushSubscriptions');
    if (!user || user.pushSubscriptions.length === 0) return;

    await Promise.all(
      user.pushSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await pushService.removeSubscription(userId, subscription.endpoint);
          } else {
            logger.error('pushService.sendToUser failed', error);
          }
        }
      }),
    );
  },
};

export default pushService;
