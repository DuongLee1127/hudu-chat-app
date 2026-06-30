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

  changePassword: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { oldPassword, newPassword } = req.body;
      const result = await userService.changePassword(String(userId), oldPassword, newPassword);
      return sendSuccess(res, result, 'Change password success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
};

export default userController;
