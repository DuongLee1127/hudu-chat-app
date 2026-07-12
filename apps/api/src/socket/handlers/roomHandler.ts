import { Socket } from 'socket.io';
import { assertMember } from '@/services/membershipService';

export const registerRoomHandlers = (socket: Socket) => {
  socket.on('conversation:join', async (payload: { conversationId: string }, ack?: (res: any) => void) => {
    try {
      const userId = String(socket.data.user.id);
      await assertMember(payload.conversationId, userId);
      socket.join(`conversation:${payload.conversationId}`);
      ack?.({ success: true });
    } catch (error) {
      ack?.({ success: false, message: error instanceof Error ? error.message : 'Không thể tham gia hội thoại!' });
    }
  });

  socket.on('conversation:leave', (payload: { conversationId: string }) => {
    socket.leave(`conversation:${payload.conversationId}`);
  });
};
