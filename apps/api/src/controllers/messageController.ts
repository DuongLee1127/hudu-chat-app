import { Request, Response } from 'express';
import messageService from '@/services/messageService';
import notificationService from '@/services/notificationService';
import { sendSuccess, sendError } from '@/helpers';
import { getIO } from '@/socket';
import { emitMessageCreated } from '@/socket/emitMessage';
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
      await emitMessageCreated(io, String(id), { message, tempId });
      await notificationService.notifyNewMessage(io, message, String(id), String(userId));
      await notificationService.notifyMentions(
        io,
        message,
        String(id),
        String(userId),
        (message.mentionedUserIds || []).map(String),
      );
      import('@/services/botService')
        .then(({ default: botService }) => botService.maybeReplyAsBot(String(id), message))
        .catch(() => {});

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
      getIO()
        .to(`conversation:${result.conversationId}`)
        .emit('message:deleted', {
          messageId: result.messageId,
          conversationId: result.conversationId,
        });
      return sendSuccess(res, result, 'Delete message success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  toggleReaction: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      if (!id || typeof req.body.emoji !== 'string') {
        return sendError(res, 'Message ID and emoji are required', 400);
      }
      const message: any = await messageService.toggleReaction(String(userId), String(id), req.body.emoji);
      getIO().to(`conversation:${message.conversationId}`).emit('message:reaction', { message });
      return sendSuccess(res, { message }, 'Toggle reaction success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  forwardMessage: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      if (!id || !Array.isArray(req.body.targetConversationIds)) {
        return sendError(res, 'Message ID and targetConversationIds are required', 400);
      }
      const messages: any[] = await messageService.forwardMessage(
        String(userId),
        String(id),
        req.body.targetConversationIds.map(String),
      );
      const io = getIO();
      await Promise.all(
        messages.map(async (message) => {
          await emitMessageCreated(io, String(message.conversationId), { message });
          await notificationService.notifyNewMessage(
            io,
            message,
            String(message.conversationId),
            String(userId),
          );
        }),
      );
      return sendSuccess(res, { messages }, 'Forward message success', 201);
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

  createPoll: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      if (!id) return sendError(res, 'Conversation ID is required', 400);
      const { question, options } = req.body;
      const message: any = await messageService.createPoll(
        String(userId),
        String(id),
        String(question || ''),
        Array.isArray(options) ? options.map(String) : [],
      );
      await emitMessageCreated(getIO(), String(id), { message });
      return sendSuccess(res, { message }, 'Create poll success', 201);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  votePoll: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      if (!id) return sendError(res, 'Message ID is required', 400);
      const optionIndex = Number(req.body.optionIndex);
      const result: any = await messageService.votePoll(String(userId), String(id), optionIndex);
      getIO()
        .to(`conversation:${result.message.conversationId}`)
        .emit('message:updated', { message: result.message, poll: result.poll });
      return sendSuccess(res, result, 'Vote poll success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getPoll: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return sendError(res, 'Unauthorized', 401);
      if (!id) return sendError(res, 'Message ID is required', 400);
      const poll = await messageService.getPollByMessageId(String(userId), String(id));
      return sendSuccess(res, { poll }, 'Get poll success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },
};

export default messageController;
