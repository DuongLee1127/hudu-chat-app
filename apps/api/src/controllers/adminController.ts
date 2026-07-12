import { Request, Response } from 'express';
import adminService from '@/services/adminService';
import reportService from '@/services/reportService';
import { sendSuccess, sendError } from '@/helpers';
import { logger } from '@/helpers/logger';
import { getIO } from '@/socket';

const disconnectUserSockets = (userId: string) => {
  const io = getIO();
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  if (!room) return;
  for (const socketId of room) {
    io.sockets.sockets.get(socketId)?.disconnect(true);
  }
};

const adminController = {
  getReports: async (req: Request, res: Response) => {
    try {
      const { status, page, pageSize } = req.query;
      const result = await reportService.listReports({
        status: status ? String(status) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });
      return sendSuccess(res, result, 'Get reports success', 200);
    } catch (error) {
      logger.error('adminController.getReports failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  updateReport: async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Report ID is required', 400);
      }

      const { status, note } = req.body;
      const report = await reportService.updateReport(String(adminId), String(id), {
        status,
        note,
      });
      return sendSuccess(res, { report }, 'Update report success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getUsers: async (req: Request, res: Response) => {
    try {
      const { q, status, page, pageSize } = req.query;
      const result = await adminService.listUsers({
        q: q ? String(q) : undefined,
        status: status ? (String(status) as 'active' | 'locked') : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });
      return sendSuccess(res, result, 'Get users success', 200);
    } catch (error) {
      logger.error('adminController.getUsers failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  updateUserStatus: async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'User ID is required', 400);
      }

      const { status, reason } = req.body;
      const user = await adminService.updateUserStatus(String(adminId), String(id), {
        status,
        reason,
      });

      if (status === 'locked') {
        disconnectUserSockets(String(id));
      }

      return sendSuccess(res, { user }, 'Update user status success', 200);
    } catch (error) {
      logger.error(`adminController.updateUserStatus failed for targetUserId=${req.params.id}`, error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getMetrics: async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      const result = await adminService.getMetrics(
        from ? new Date(String(from)) : undefined,
        to ? new Date(String(to)) : undefined,
      );
      return sendSuccess(res, result, 'Get metrics success', 200);
    } catch (error) {
      logger.error('adminController.getMetrics failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
};

export default adminController;
