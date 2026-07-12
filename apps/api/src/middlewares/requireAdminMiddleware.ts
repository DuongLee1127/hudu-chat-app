import { Request, Response, NextFunction } from 'express';
import User from '@/models/user';
import { sendError } from '@/helpers';

// Must run after authMiddleware. Re-checks the role from the database on every
// request (instead of trusting a role claim baked into the JWT) so that revoking
// admin rights takes effect immediately, without waiting for the token to expire.
export const requireAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const user = await User.findById(userId).select('role accountStatus');
    if (!user) {
      return sendError(res, 'Unauthorized', 401);
    }
    if (user.accountStatus === 'locked') {
      return sendError(res, 'Tài khoản của bạn đã bị khóa!', 403);
    }
    if (user.role !== 'admin') {
      return sendError(res, 'Bạn không có quyền truy cập tài nguyên này!', 403);
    }

    return next();
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};
