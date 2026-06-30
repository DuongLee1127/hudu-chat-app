import { Router } from 'express';
import userController from '@/controllers/userController';
import { authMiddleware } from '@/middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update profile details for current logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Update profile success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     bio:
 *                       type: string
 *       400:
 *         description: Username already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change password for current logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Change password success
 *       400:
 *         description: Bad request (mismatched password or validation error)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.put('/me', authMiddleware, userController.updateMe);
router.put('/me/password', authMiddleware, userController.changePassword);

export default router;
