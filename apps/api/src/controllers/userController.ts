import { Request, Response } from 'express';
import userService from '@/services/userService';
import { sendSuccess, sendError } from '@/helpers';

const userController = {
  updateMe: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { username, avatar, bio } = req.body;
      const result = await userService.updateProfile(String(userId), { username, avatar, bio });
      return sendSuccess(res, result, 'Update profile success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const result = await userService.getAllUsers();
      return sendSuccess(res, result, 'Get all users success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  searchUsers: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const q = String(req.query.q || '');
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.max(1, Number(req.query.pageSize) || 10);

      const result = await userService.searchUsers(String(currentUserId), q, page, pageSize);
      return sendSuccess(res, result, 'Search users success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getUserProfile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const user = await userService.getUserProfile(String(id));
      return sendSuccess(res, { publicUser: user }, 'Get user profile success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  blockUser: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const result = await userService.blockUser(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Block user success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  unblockUser: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const result = await userService.unblockUser(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Unblock user success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getBlockedUsers: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.max(1, Number(req.query.pageSize) || 10);

      const result = await userService.getBlockedUsers(String(currentUserId), page, pageSize);
      return sendSuccess(res, result, 'Get blocked users success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  savePushSubscription: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      const { endpoint, keys } = req.body || {};
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return sendError(res, 'Invalid push subscription', 400);
      }
      const pushService = (await import('@/services/pushService')).default;
      const result = await pushService.saveSubscription(String(userId), { endpoint, keys });
      return sendSuccess(res, result, 'Save push subscription success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  removePushSubscription: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      const endpoint = String(req.body?.endpoint || '');
      if (!endpoint) return sendError(res, 'endpoint is required', 400);
      const pushService = (await import('@/services/pushService')).default;
      const result = await pushService.removeSubscription(String(userId), endpoint);
      return sendSuccess(res, result, 'Remove push subscription success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  createRemind: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      const content = String(req.body?.content || '').trim();
      const dueAt = new Date(req.body?.dueAt);
      if (!content) return sendError(res, 'content is required', 400);
      if (Number.isNaN(dueAt.getTime())) return sendError(res, 'dueAt is invalid', 400);
      const Remind = (await import('@/models/remind')).default;
      const remind = await Remind.create({ userId, content, dueAt });
      return sendSuccess(res, { remind }, 'Create remind success', 201);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
};

export default userController;
