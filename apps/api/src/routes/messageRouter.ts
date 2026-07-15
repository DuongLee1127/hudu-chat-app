import { Router } from 'express';
import messageController from '@/controllers/messageController';
import { authMiddleware } from '@/middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/messages/{id}:
 *   patch:
 *     summary: Edit a message's content (sender only, within allowed time window)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated
 *       400:
 *         description: Bad request (not owner / edit window expired / empty content)
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Soft delete a message (sender, or admin in group conversations)
 *     tags: [Messages]
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
 *         description: Message deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

router.patch('/:id', authMiddleware, messageController.editMessage);
router.delete('/:id', authMiddleware, messageController.deleteMessage);
router.post('/:id/reactions', authMiddleware, messageController.toggleReaction);
router.post('/:id/forward', authMiddleware, messageController.forwardMessage);
router.post('/:id/poll/vote', authMiddleware, messageController.votePoll);
router.get('/:id/poll', authMiddleware, messageController.getPoll);

export default router;
