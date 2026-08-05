import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient, attachErrorHandler } from '@/config/redis';
import { socketAuthMiddleware } from '@/socket/middlewares/socketAuth';
import {
  handleConnectionPresence,
  handleDisconnectPresence,
} from '@/socket/handlers/presenceHandler';
import { registerRoomHandlers } from '@/socket/handlers/roomHandler';
import { registerMessageHandlers } from '@/socket/handlers/messageHandler';
import { registerTypingHandlers } from '@/socket/handlers/typingHandler';
import { registerReadHandlers } from '@/socket/handlers/readHandler';
import { registerCallHandlers } from '@/socket/handlers/callHandler';
import callService from '@/services/callService';

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  const pubClient = attachErrorHandler(redisClient.duplicate(), 'socket.io pub client');
  const subClient = attachErrorHandler(redisClient.duplicate(), 'socket.io sub client');
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerRoomHandlers(socket);
    registerMessageHandlers(io as Server, socket);
    registerTypingHandlers(socket);
    registerReadHandlers(io as Server, socket);
    registerCallHandlers(io as Server, socket);

    socket.on('disconnect', () => {
      handleDisconnectPresence(io as Server, socket).catch((err) => {
        console.error('Error handling disconnect presence:', err);
      });
      callService.handleUserDisconnect(io as Server, socket).catch((err) => {
        console.error('Error handling disconnect call cleanup:', err);
      });
    });

    handleConnectionPresence(io as Server, socket).catch((err) => {
      console.error('Error handling connection presence:', err);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};
