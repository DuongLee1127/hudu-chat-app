import { Request, Response } from 'express';
import searchService from '@/services/searchService';
import { sendSuccess, sendError } from '@/helpers';
import { logger } from '@/helpers/logger';

const searchController = {
  searchMessages: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { conversationId, q, limit } = req.query;
      if (!q) {
        return sendError(res, 'q is required', 400);
      }

      const result = await searchService.searchMessages(String(userId), {
        conversationId: conversationId ? String(conversationId) : undefined,
        q: String(q),
        limit: limit ? Number(limit) : undefined,
      });
      return sendSuccess(res, result, 'Search messages success', 200);
    } catch (error) {
      logger.error('searchController.searchMessages failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  searchConversations: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { q, limit } = req.query;
      const result = await searchService.searchConversations(
        String(userId),
        q ? String(q) : '',
        limit ? Number(limit) : undefined,
      );
      return sendSuccess(res, result, 'Search conversations success', 200);
    } catch (error) {
      logger.error('searchController.searchConversations failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  searchGlobal: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { q } = req.query;
      if (!q) {
        return sendError(res, 'q is required', 400);
      }

      const result = await searchService.searchGlobal(String(userId), String(q));
      return sendSuccess(res, result, 'Search global success', 200);
    } catch (error) {
      logger.error('searchController.searchGlobal failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default searchController;
