import { Server, Socket } from 'socket.io';
import messageService from '@/services/messageService';
import ConversationMember from '@/models/conversation_member';

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

        const members = await ConversationMember.find({
          conversationId: payload.conversationId,
          userId: { $ne: userId },
        }).select('userId');

        members.forEach((member) => {
          io.to(`user:${String(member.userId)}`).emit('notification:new', {
            notification: {
              type: 'message',
              conversationId: payload.conversationId,
              message,
            },
          });
        });

        ack?.({ success: true, data: message, tempId: payload.tempId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gửi tin nhắn thất bại!';
        ack?.({ success: false, error: errorMessage, tempId: payload.tempId });
        socket.emit('message:error', { tempId: payload.tempId, message: errorMessage });
      }
    },
  );
};
