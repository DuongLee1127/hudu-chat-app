import { Socket } from 'socket.io';
import { parseCookie } from 'cookie';
import { verifyToken, TokenPayload } from '@/providers/JwtProvider';
import { logger } from '@/helpers/logger';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    let token: string | undefined = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.cookie) {
      const cookies = parseCookie(socket.handshake.headers.cookie);
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
    logger.error('socketAuthMiddleware rejected connection', error);
    return next(new Error('unauthorized'));
  }
};
