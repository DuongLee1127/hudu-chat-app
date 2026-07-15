import { Socket } from 'socket.io';
import { verifyToken, TokenPayload } from '@/providers/JwtProvider';

// NOTE: cookie@2.x is ESM-only and breaks under CommonJS (`parse is not a function`),
// which silently rejected every cookie-authenticated socket. Parse manually instead.
const parseCookieHeader = (header: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (!key) continue;
    let value = part.slice(index + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
};

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    let token: string | undefined = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.cookie) {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      return next(new Error('unauthorized'));
    }

    const jwtAccessToken = process.env.JWT_ACCESS_TOKEN;
    if (!jwtAccessToken) {
      throw new Error('JWT environment variables are not defined!');
    }

    const decoded = (await verifyToken(token, jwtAccessToken)) as any;
    if (!decoded || !decoded.id) {
      return next(new Error('unauthorized'));
    }

    socket.data.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    } as TokenPayload;

    return next();
  } catch (error) {
    return next(new Error('unauthorized'));
  }
};
