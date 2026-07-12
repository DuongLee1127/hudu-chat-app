import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { sendError } from '@/helpers';

// Combine IP + userId so the limit tracks a given person even behind a shared
// IP, while still bucketing anonymous/pre-auth traffic by IP alone.
const authenticatedKeyGenerator = (req: Request) => {
  const userId = req.user?.id ? String(req.user.id) : 'anon';
  return `${req.ip}:${userId}`;
};

const buildLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) =>
  rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
    handler: (_req: Request, res: Response) => {
      sendError(res, options.message, 429);
    },
  });

export const loginRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút!',
});

export const searchRateLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Bạn đã tìm kiếm quá nhiều lần. Vui lòng thử lại sau ít phút!',
  keyGenerator: authenticatedKeyGenerator,
});

export const sendMessageRateLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau!',
  keyGenerator: authenticatedKeyGenerator,
});

export const reportRateLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Bạn đã gửi báo cáo quá nhiều lần. Vui lòng thử lại sau!',
  keyGenerator: authenticatedKeyGenerator,
});

export const adminActionRateLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Thao tác quá nhanh. Vui lòng thử lại sau!',
  keyGenerator: authenticatedKeyGenerator,
});
