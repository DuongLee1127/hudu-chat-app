import { Request, Response } from 'express';
import messageService from '@/services/messageService';
import notificationService from '@/services/notificationService';
import { sendSuccess, sendError } from '@/helpers';
import { getIO } from '@/socket';
import { logger } from '@/helpers/logger';

const messageController = {
  listMessages: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const { before, after, limit } = req.query;
      const result = await messageService.listMessages(String(userId), String(id), {
        before: before ? String(before) : undefined,
        after: after ? String(after) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return sendSuccess(res, result, 'Get messages success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const { type, content, attachmentIds, replyToMessageId, tempId } = req.body;
      const message: any = await messageService.sendMessage(String(userId), String(id), {
        type,
        content,
        attachmentIds: Array.isArray(attachmentIds) ? attachmentIds.map(String) : [],
        replyToMessageId,
      });

      const io = getIO();
      io.to(`conversation:${id}`).emit('message:created', { message, tempId });
      await notificationService.notifyNewMessage(io, message, String(id), String(userId));

      return sendSuccess(res, { message, tempId }, 'Send message success', 201);
    } catch (error) {
      logger.error('messageController.sendMessage failed', error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  editMessage: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Message ID is required', 400);
      }

      const { content } = req.body;
      const message: any = await messageService.editMessage(String(userId), String(id), content);
      getIO().to(`conversation:${message.conversationId}`).emit('message:updated', { message });
      return sendSuccess(res, { message }, 'Edit message success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  deleteMessage: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Message ID is required', 400);
      }

      const result = await messageService.deleteMessage(String(userId), String(id));
      getIO().to(`conversation:${result.conversationId}`).emit('message:deleted', {
        messageId: result.messageId,
        conversationId: result.conversationId,
      });
      return sendSuccess(res, result, 'Delete message success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  markAsRead: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const { lastReadMessageId } = req.body;
      if (!lastReadMessageId) {
        return sendError(res, 'lastReadMessageId is required', 400);
      }

      const memberSetting = await messageService.markAsRead(
        String(userId),
        String(id),
        String(lastReadMessageId),
      );
      return sendSuccess(res, { memberSetting }, 'Mark as read success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const result = await messageService.getUnreadCount(String(userId), String(id));
      return sendSuccess(res, result, 'Get unread count success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  togglePinMessage: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Message ID is required', 400);
      }

      const message: any = await messageService.togglePinMessage(String(userId), String(id));
      getIO().to(`conversation:${message.conversationId}`).emit('message:updated', { message });
      return sendSuccess(res, { message }, 'Toggle pin message success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getPinnedMessages: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const pinnedMessages = await messageService.getPinnedMessages(String(userId), String(id));
      return sendSuccess(res, { items: pinnedMessages }, 'Get pinned messages success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default messageController;
