import { Request, Response } from 'express';
import storyService, { getFriendIds } from '@/services/storyService';
import { sendSuccess, sendError } from '@/helpers';
import { getIO } from '@/socket';

const storyController = {
  createStory: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const file = req.file;
      if (!file) {
        return sendError(res, 'Vui lòng chọn ảnh để đăng story!', 400);
      }

      const { caption } = req.body;
      const story = await storyService.createStory(String(userId), file, caption);

      const friendIds = await getFriendIds(String(userId));
      const io = getIO();
      friendIds.forEach((friendId) => {
        io.to(`user:${friendId}`).emit('story:new', { userId: String(userId) });
      });

      return sendSuccess(res, { story }, 'Create story success', 201);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  listFeed: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const feed = await storyService.listFeed(String(userId));
      return sendSuccess(res, { feed }, 'Get story feed success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getStoriesByUser: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { userId: targetUserId } = req.params;
      const stories = await storyService.getStoriesByUser(String(userId), String(targetUserId));
      return sendSuccess(res, { stories }, 'Get user stories success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  deleteStory: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await storyService.deleteStory(String(userId), String(id));
      return sendSuccess(res, result, 'Delete story success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  listViewers: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const viewers = await storyService.listViewers(String(userId), String(id));
      return sendSuccess(res, { viewers }, 'Get story viewers success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },
};

export default storyController;
