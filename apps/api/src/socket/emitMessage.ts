import type { Server } from 'socket.io';
import ConversationMember from '@/models/conversation_member';

const toPlainMessage = (message: unknown) => {
  if (message && typeof message === 'object' && 'toJSON' in message && typeof (message as { toJSON: () => unknown }).toJSON === 'function') {
    return (message as { toJSON: () => unknown }).toJSON();
  }
  return message;
};

/**
 * Broadcast a chat event to the conversation room and every member's personal
 * user room. User-room fan-out keeps realtime working even if a client failed
 * to join `conversation:{id}` (e.g. late join / reconnect race).
 */
export const emitMessageCreated = async (
  io: Server,
  conversationId: string,
  payload: { message: unknown; tempId?: string },
) => {
  const id = String(conversationId);
  const body = {
    message: toPlainMessage(payload.message),
    tempId: payload.tempId,
  };

  io.to(`conversation:${id}`).emit('message:created', body);

  const members = await ConversationMember.find({ conversationId: id }).select('userId').lean();
  for (const member of members) {
    io.to(`user:${String(member.userId)}`).emit('message:created', body);
  }
};
