import { Request, Response } from 'express';
import reportService from '@/services/reportService';
import { sendSuccess, sendError } from '@/helpers';
import { logger } from '@/helpers/logger';

const reportController = {
  createReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { targetType, targetId, reason } = req.body;
      const report = await reportService.createReport(String(userId), {
        targetType,
        targetId,
        reason,
      });
      return sendSuccess(res, { report }, 'Create report success', 201);
    } catch (error) {
      logger.error('reportController.createReport failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default reportController;
