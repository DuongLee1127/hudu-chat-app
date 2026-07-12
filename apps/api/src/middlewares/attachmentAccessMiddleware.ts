import { Request, Response, NextFunction } from 'express';
import { verifyAttachmentToken } from '@/providers/AttachmentTokenProvider';
import { authMiddleware } from '@/middlewares/authMiddleware';

/**
 * Grants access to a signed attachment URL (?token=...) without requiring a login
 * session, mirroring how a presigned cloud-storage URL works. Falls back to normal
 * cookie/bearer session auth when no valid token is present.
 */
export const attachmentAccessMiddleware =
  (variant: 'original' | 'thumbnail') =>
  (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;
    const id = req.params.id ? String(req.params.id) : undefined;

    if (typeof token === 'string' && id && verifyAttachmentToken(token, id, variant)) {
      return next();
    }

    return authMiddleware(req, res, next);
  };
