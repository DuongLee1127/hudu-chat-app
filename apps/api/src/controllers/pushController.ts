import { Request, Response } from 'express';
import pushService from '@/services/pushService';
import { sendSuccess, sendError } from '@/helpers';

const pushController = {
  subscribe: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return sendError(res, 'Invalid push subscription', 400);
      }

      const result = await pushService.saveSubscription(String(userId), { endpoint, keys });
      return sendSuccess(res, result, 'Subscribe push notification success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  unsubscribe: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { endpoint } = req.body;
      if (!endpoint) {
        return sendError(res, 'endpoint is required', 400);
      }

      const result = await pushService.removeSubscription(String(userId), String(endpoint));
      return sendSuccess(res, result, 'Unsubscribe push notification success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default pushController;
