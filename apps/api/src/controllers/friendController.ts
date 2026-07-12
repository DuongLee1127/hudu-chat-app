import { Request, Response } from 'express';
import friendService from '@/services/friendService';
import { sendSuccess, sendError } from '@/helpers';

const friendController = {
  sendRequest: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const result = await friendService.sendRequest(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Send friend request success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  respondToOrCancelRequest: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const result = await friendService.respondToOrCancelRequest(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Remove friend request success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  acceptRequest: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const result = await friendService.acceptRequest(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Accept friend request success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  unfriend: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const result = await friendService.unfriend(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Unfriend success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getFriends: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const q = String(req.query.q || '');
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.max(1, Number(req.query.pageSize) || 10);

      const result = await friendService.getFriends(String(currentUserId), q, page, pageSize);
      return sendSuccess(res, result, 'Get friends success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getIncomingRequests: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await friendService.getIncomingRequests(String(currentUserId));
      return sendSuccess(res, result, 'Get incoming friend requests success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getOutgoingRequests: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await friendService.getOutgoingRequests(String(currentUserId));
      return sendSuccess(res, result, 'Get outgoing friend requests success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
};

export default friendController;
