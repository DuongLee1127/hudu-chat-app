import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/providers/JwtProvider';
import { sendError } from '@/helpers';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get access token from cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Bạn chưa đăng nhập hoặc token không hợp lệ!', 401);
    }

    const jwtAccessToken = process.env.JWT_ACCESS_TOKEN;
    if (!jwtAccessToken) {
      throw new Error('JWT environment variables are not defined!');
    }

    // 2. Verify token
    const decoded = (await verifyToken(token, jwtAccessToken)) as any;
    if (!decoded || !decoded.id) {
      return sendError(res, 'Token không hợp lệ hoặc đã hết hạn!', 401);
    }

    // 3. Attach decoded payload to req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };

    return next();
  } catch (error) {
    return sendError(res, 'Token không hợp lệ hoặc đã hết hạn!', 401);
  }
};
