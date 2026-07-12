import { Socket } from 'socket.io';

export const registerTypingHandlers = (socket: Socket) => {
  const userId = String(socket.data.user.id);

  socket.on('typing:start', (payload: { conversationId: string }) => {
    socket.to(`conversation:${payload.conversationId}`).emit('typing:start', {
      conversationId: payload.conversationId,
      userId,
    });
  });

  socket.on('typing:stop', (payload: { conversationId: string }) => {
    socket.to(`conversation:${payload.conversationId}`).emit('typing:stop', {
      conversationId: payload.conversationId,
      userId,
    });
  });
};
