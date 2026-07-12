import { Request, Response } from 'express';
import notificationService from '@/services/notificationService';
import { sendSuccess, sendError } from '@/helpers';
import { logger } from '@/helpers/logger';

const notificationController = {
  getNotifications: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { page, pageSize, unreadOnly } = req.query;
      const result = await notificationService.listNotifications(String(userId), {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
      });
      return sendSuccess(res, result, 'Get notifications success', 200);
    } catch (error) {
      logger.error('notificationController.getNotifications failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  markAsRead: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Notification ID is required', 400);
      }

      const notification = await notificationService.markAsRead(String(userId), String(id));
      return sendSuccess(res, { notification }, 'Mark notification as read success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  markAllAsRead: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await notificationService.markAllAsRead(String(userId));
      return sendSuccess(res, result, 'Mark all notifications as read success', 200);
    } catch (error) {
      logger.error('notificationController.markAllAsRead failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
};

export default notificationController;
