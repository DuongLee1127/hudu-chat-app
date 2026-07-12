import { Router } from 'express';
import attachmentController from '@/controllers/attachmentController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { attachmentAccessMiddleware } from '@/middlewares/attachmentAccessMiddleware';

const router = Router();

/**
 * @swagger
 * /api/attachments/{id}:
 *   get:
 *     summary: Get attachment metadata (uploader or conversation members only)
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment metadata
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: No permission to view this attachment
 *   delete:
 *     summary: Delete an attachment not yet attached to a message (uploader only)
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted
 *       400:
 *         description: Bad request (not owner / already attached to a message)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/attachments/{id}/download:
 *   get:
 *     summary: Download/stream the attachment file (session auth, or a short-lived signed ?token=)
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Signed short-lived download token (alternative to session auth)
 *     responses:
 *       200:
 *         description: File stream
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: No permission to download this attachment
 */

/**
 * @swagger
 * /api/attachments/{id}/thumbnail:
 *   get:
 *     summary: Get the generated thumbnail for an image attachment (session auth, or signed ?token=)
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thumbnail image stream
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: No permission to view this attachment
 */

router.get('/:id', authMiddleware, attachmentController.getAttachment);
router.get(
  '/:id/download',
  attachmentAccessMiddleware('original'),
  attachmentController.downloadAttachment,
);
router.get(
  '/:id/thumbnail',
  attachmentAccessMiddleware('thumbnail'),
  attachmentController.getThumbnail,
);
router.delete('/:id', authMiddleware, attachmentController.deleteAttachment);

export default router;
