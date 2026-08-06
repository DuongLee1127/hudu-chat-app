import { Server, Socket } from 'socket.io';
import messageService from '@/services/messageService';
import notificationService from '@/services/notificationService';

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

        const { modifiedCount } = await notificationService.markConversationNotificationsAsRead(
          userId,
          payload.conversationId,
        );
        if (modifiedCount > 0) {
          io.to(`user:${userId}`).emit('notification:read-bulk', {
            conversationId: payload.conversationId,
          });
        }

        ack?.({ success: true });
      } catch (error) {
        ack?.({ success: false, message: error instanceof Error ? error.message : 'Không thể đánh dấu đã đọc!' });
      }
    },
  );
};
