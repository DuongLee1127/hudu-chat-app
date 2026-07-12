import { Request, Response } from 'express';
import attachmentService from '@/services/attachmentService';
import { sendSuccess, sendError } from '@/helpers';

const attachmentController = {
  uploadFile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return sendError(res, 'Vui lòng chọn tệp để tải lên!', 400);
      }

      const attachments = await attachmentService.uploadFiles(String(userId), files);
      return sendSuccess(res, { attachments }, 'Upload file success', 201);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getAttachment: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Attachment ID is required', 400);
      }

      const attachment = await attachmentService.getAttachmentById(String(userId), String(id));
      return sendSuccess(res, { attachment }, 'Get attachment success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  downloadAttachment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Attachment ID is required', 400);
      }

      const userId = req.user?.id;
      const url = userId
        ? await attachmentService.resolveDownloadUrl(String(userId), String(id))
        : await attachmentService.resolveDownloadUrlByToken(String(id));

      return res.redirect(302, url);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  getThumbnail: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Attachment ID is required', 400);
      }

      const userId = req.user?.id;
      const url = userId
        ? await attachmentService.resolveThumbnailUrl(String(userId), String(id))
        : await attachmentService.resolveThumbnailUrlByToken(String(id));

      return res.redirect(302, url);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  deleteAttachment: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Attachment ID is required', 400);
      }

      const result = await attachmentService.deleteAttachment(String(userId), String(id));
      return sendSuccess(res, result, 'Delete attachment success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default attachmentController;
