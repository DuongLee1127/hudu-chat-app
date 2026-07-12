import { Router } from 'express';
import multer from 'multer';
import attachmentController from '@/controllers/attachmentController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { upload, MAX_FILES_PER_UPLOAD } from '@/config/upload';
import { sendError } from '@/helpers';

const router = Router();

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload one or more files/images as attachments
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Attachments uploaded
 *       400:
 *         description: Bad request (invalid mime type / file too large / too many files)
 *       401:
 *         description: Unauthorized
 */

router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    upload.array('files', MAX_FILES_PER_UPLOAD)(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'Dung lượng tệp vượt quá giới hạn cho phép (20MB)!', 400);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return sendError(res, `Chỉ được tải lên tối đa ${MAX_FILES_PER_UPLOAD} tệp mỗi lần!`, 400);
        }
      }
      if (err) {
        return sendError(res, err instanceof Error ? err.message : 'Tải tệp lên thất bại!', 400);
      }
      return next();
    });
  },
  attachmentController.uploadFile,
);

export default router;
