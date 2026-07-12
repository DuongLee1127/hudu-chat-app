import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from '@/socket/middlewares/socketAuth';
import { handleConnectionPresence, handleDisconnectPresence } from '@/socket/handlers/presenceHandler';
import { registerRoomHandlers } from '@/socket/handlers/roomHandler';
import { registerMessageHandlers } from '@/socket/handlers/messageHandler';
import { registerTypingHandlers } from '@/socket/handlers/typingHandler';
import { registerReadHandlers } from '@/socket/handlers/readHandler';

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerRoomHandlers(socket);
    registerMessageHandlers(io as Server, socket);
    registerTypingHandlers(socket);
    registerReadHandlers(io as Server, socket);

    socket.on('disconnect', () => {
      handleDisconnectPresence(io as Server, socket).catch((err) => {
        console.error('Error handling disconnect presence:', err);
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
