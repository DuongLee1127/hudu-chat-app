import { Request, Response } from 'express';
import userService from '@/services/userService';
import { sendSuccess, sendError } from '@/helpers';
import { getIO } from '@/socket';

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
      getIO().to(`user:${id}`).emit('user:blocked', { by: String(currentUserId) });
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
      getIO().to(`user:${id}`).emit('user:unblocked', { by: String(currentUserId) });
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
};

export default userController;
