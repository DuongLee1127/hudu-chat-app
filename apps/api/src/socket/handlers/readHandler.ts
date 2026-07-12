import { Server, Socket } from 'socket.io';
import messageService from '@/services/messageService';

export const registerReadHandlers = (io: Server, socket: Socket) => {
  socket.on(
    'message:read',
    async (payload: { conversationId: string; lastReadMessageId: string }, ack?: (res: any) => void) => {
      const userId = String(socket.data.user.id);
      try {
        await messageService.markAsRead(userId, payload.conversationId, payload.lastReadMessageId);

        io.to(`conversation:${payload.conversationId}`).emit('message:read', {
          conversationId: payload.conversationId,
          userId,
          lastReadMessageId: payload.lastReadMessageId,
        });

        ack?.({ success: true });
      } catch (error) {
        ack?.({ success: false, message: error instanceof Error ? error.message : 'Không thể đánh dấu đã đọc!' });
      }
    },
  );
};
