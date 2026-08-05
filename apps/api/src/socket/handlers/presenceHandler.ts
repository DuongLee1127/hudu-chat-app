import { Server, Socket } from 'socket.io';
import ConversationMember from '@/models/conversation_member';
import User from '@/models/user';
import { addUserSocket, removeUserSocket } from '@/socket/onlineUsers';

const getRelatedUserIds = async (userId: string) => {
  const memberships = await ConversationMember.find({ userId }).select('conversationId');
  const conversationIds = memberships.map((m) => m.conversationId);

  const otherMembers = await ConversationMember.find({
    conversationId: { $in: conversationIds },
    userId: { $ne: userId },
  }).select('userId');

  return Array.from(new Set(otherMembers.map((m) => String(m.userId))));
};

export const handleConnectionPresence = async (io: Server, socket: Socket) => {
  const userId = String(socket.data.user.id);
  socket.join(`user:${userId}`);

  const { wasOffline } = await addUserSocket(userId, socket.id);
  if (wasOffline) {
    await User.findByIdAndUpdate(userId, { status: 'online' });
    const relatedUserIds = await getRelatedUserIds(userId);
    relatedUserIds.forEach((otherUserId) => {
      io.to(`user:${otherUserId}`).emit('presence:online', { userId });
    });
  }
};

export const handleDisconnectPresence = async (io: Server, socket: Socket) => {
  const userId = String(socket.data.user.id);
  const { isNowOffline } = await removeUserSocket(userId, socket.id);

  if (isNowOffline) {
    const lastSeenAt = new Date();
    await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: lastSeenAt });
    const relatedUserIds = await getRelatedUserIds(userId);
    relatedUserIds.forEach((otherUserId) => {
      io.to(`user:${otherUserId}`).emit('presence:offline', { userId, lastSeenAt });
    });
  }
};
