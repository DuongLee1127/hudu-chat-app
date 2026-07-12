import { Server, Socket } from 'socket.io';
import messageService from '@/services/messageService';
import notificationService from '@/services/notificationService';
import { isRateLimited } from '@/socket/rateLimit';
import { logger } from '@/helpers/logger';

const SEND_MESSAGE_WINDOW_MS = 60 * 1000;
const SEND_MESSAGE_MAX = 60;

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  socket.on(
    'message:send',
    async (
      payload: {
        conversationId: string;
        type?: 'text' | 'image' | 'file' | 'video' | 'audio';
        content?: string;
        attachmentIds?: string[];
        replyToMessageId?: string;
        tempId?: string;
      },
      ack?: (res: any) => void,
    ) => {
      const userId = String(socket.data.user.id);

      if (isRateLimited(`message:send:${userId}`, SEND_MESSAGE_WINDOW_MS, SEND_MESSAGE_MAX)) {
        const errorMessage = 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau!';
        ack?.({ success: false, error: errorMessage, tempId: payload.tempId });
        socket.emit('message:error', { tempId: payload.tempId, message: errorMessage });
        return;
      }

      try {
        const message = await messageService.sendMessage(userId, payload.conversationId, {
          type: payload.type,
          content: payload.content,
          attachmentIds: payload.attachmentIds,
          replyToMessageId: payload.replyToMessageId,
        });

        io.to(`conversation:${payload.conversationId}`).emit('message:created', {
          message,
          tempId: payload.tempId,
        });

        await notificationService.notifyNewMessage(io, message, payload.conversationId, userId);

        ack?.({ success: true, data: message, tempId: payload.tempId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gửi tin nhắn thất bại!';
        logger.error('socket message:send failed', error);
        ack?.({ success: false, error: errorMessage, tempId: payload.tempId });
        socket.emit('message:error', { tempId: payload.tempId, message: errorMessage });
      }
    },
  );
};
