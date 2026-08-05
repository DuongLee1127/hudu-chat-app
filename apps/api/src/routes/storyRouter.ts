import { Router } from 'express';
import multer from 'multer';
import storyController from '@/controllers/storyController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { upload } from '@/config/upload';
import { sendError } from '@/helpers';

const router = Router();

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Create a new 24h story (image only)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               caption:
 *                 type: string
 *     responses:
 *       201:
 *         description: Story created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/feed:
 *   get:
 *     summary: List active stories from friends and self, grouped by user
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Story feed returned
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/user/{userId}:
 *   get:
 *     summary: Get active stories of a user (friends or self only); marks them as viewed
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stories returned
 *       403:
 *         description: Not allowed to view this user's stories
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/{id}:
 *   delete:
 *     summary: Delete a story (owner only)
 *     tags: [Stories]
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
 *         description: Story deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/{id}/viewers:
 *   get:
 *     summary: List viewers of a story (owner only)
 *     tags: [Stories]
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
 *         description: Viewers returned
 *       403:
 *         description: Not the story owner
 *       401:
 *         description: Unauthorized
 */

router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'Dung lượng ảnh vượt quá giới hạn cho phép!', 400);
        }
      }
      if (err) {
        return sendError(res, err instanceof Error ? err.message : 'Tải ảnh lên thất bại!', 400);
      }
      return next();
    });
  },
  storyController.createStory,
);
router.get('/feed', authMiddleware, storyController.listFeed);
router.get('/user/:userId', authMiddleware, storyController.getStoriesByUser);
router.delete('/:id', authMiddleware, storyController.deleteStory);
router.get('/:id/viewers', authMiddleware, storyController.listViewers);

export default router;
