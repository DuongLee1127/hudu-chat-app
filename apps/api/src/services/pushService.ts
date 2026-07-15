import webpush from 'web-push';
import User from '@/models/user';
import { logger } from '@/helpers/logger';

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@hudu.local';

let configured = false;
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  configured = true;
}

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const pushService = {
  isConfigured: () => configured,

  saveSubscription: async (userId: string, subscription: PushSubscriptionPayload) => {
    await User.updateOne(
      { _id: userId },
      {
        $pull: { pushSubscriptions: { endpoint: subscription.endpoint } },
      },
    );
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          pushSubscriptions: {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
        },
      },
    );
    return { success: true };
  },

  removeSubscription: async (userId: string, endpoint: string) => {
    await User.updateOne({ _id: userId }, { $pull: { pushSubscriptions: { endpoint } } });
    return { success: true };
  },

  sendToUser: async (userId: string, payload: { title: string; body: string; url?: string }) => {
    if (!configured) return;

    try {
      const user = await User.findById(userId).select('pushSubscriptions');
      if (!user?.pushSubscriptions?.length) return;

      const body = JSON.stringify(payload);
      await Promise.all(
        user.pushSubscriptions.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
              },
              body,
            );
          } catch (error: any) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
              await User.updateOne(
                { _id: userId },
                { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } },
              );
            } else {
              logger.error('pushService.sendToUser failed', error);
            }
          }
        }),
      );
    } catch (error) {
      logger.error('pushService.sendToUser failed', error);
    }
  },
};

export default pushService;
