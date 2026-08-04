import { Request, Response } from 'express';
import callService from '@/services/callService';
import { sendSuccess, sendError } from '@/helpers';

const callController = {
  getActiveCall: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const result = await callService.getActiveCallForConversation(String(currentUserId), String(id));
      return sendSuccess(res, result, 'Get active call success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default callController;
