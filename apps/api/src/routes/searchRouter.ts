import { Router } from 'express';
import searchController from '@/controllers/searchController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { searchRateLimiter } from '@/middlewares/rateLimitMiddleware';

const router = Router();

/**
 * @swagger
 * /api/search/messages:
 *   get:
 *     summary: Search messages within conversations the current user belongs to
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *         description: Limit search to a single conversation (must be a member)
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching messages ranked by relevance
 *       400:
 *         description: Bad request (missing q / not a member of conversationId)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/search/conversations:
 *   get:
 *     summary: Search the current user's conversations by name
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching conversations
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/search/global:
 *   get:
 *     summary: Global search across users, conversations, and messages
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Combined search results
 *       400:
 *         description: Bad request (missing q)
 *       401:
 *         description: Unauthorized
 */

router.get('/messages', authMiddleware, searchRateLimiter, searchController.searchMessages);
router.get(
  '/conversations',
  authMiddleware,
  searchRateLimiter,
  searchController.searchConversations,
);
router.get('/global', authMiddleware, searchRateLimiter, searchController.searchGlobal);

export default router;
