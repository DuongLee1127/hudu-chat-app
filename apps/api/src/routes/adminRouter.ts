import { Router } from 'express';
import adminController from '@/controllers/adminController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { requireAdminMiddleware } from '@/middlewares/requireAdminMiddleware';
import { adminActionRateLimiter } from '@/middlewares/rateLimitMiddleware';

const router = Router();

// All routes below require a valid session AND an admin role.
router.use(authMiddleware, requireAdminMiddleware, adminActionRateLimiter);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Admin - list content/user reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of reports with pagination meta
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */

/**
 * @swagger
 * /api/admin/reports/{id}:
 *   patch:
 *     summary: Admin - update a report's processing status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Admin - list users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, locked]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of users with pagination meta
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Admin - lock or unlock a user's account
 *     tags: [Admin]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, locked]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */

/**
 * @swagger
 * /api/admin/metrics:
 *   get:
 *     summary: Admin - basic platform metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Users/messages/conversations totals and counts within range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */

router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReport);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/metrics', adminController.getMetrics);

export default router;
