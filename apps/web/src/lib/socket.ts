import { io, Socket } from 'socket.io-client';

const API_PORT = process.env.NEXT_PUBLIC_API_PORT || '5000';

/** Connect straight to the API — Next.js rewrites do not proxy Socket.IO reliably. */
function resolveSocketUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      withCredentials: true,
      autoConnect: false,
      // Polling first: more reliable with cookie auth across ports in dev.
      transports: ['polling', 'websocket'],
      reconnection: true,
      timeout: 20000,
    });
  }
  return socket;
};
