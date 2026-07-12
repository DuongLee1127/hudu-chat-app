import { Router } from 'express';
import reportController from '@/controllers/reportController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { reportRateLimiter } from '@/middlewares/rateLimitMiddleware';

const router = Router();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Report a message, user, or conversation
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *               - reason
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [message, user, conversation]
 *               targetId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report created
 *       400:
 *         description: Bad request (invalid target / missing reason)
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many reports submitted
 */

router.post('/', authMiddleware, reportRateLimiter, reportController.createReport);

export default router;
