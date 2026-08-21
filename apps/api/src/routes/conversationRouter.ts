import { Router } from 'express';
import conversationController from '@/controllers/conversationController';
import messageController from '@/controllers/messageController';
import callController from '@/controllers/callController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { sendMessageRateLimiter } from '@/middlewares/rateLimitMiddleware';

const router = Router();

/**
 * @swagger
 * /api/conversations/direct:
 *   post:
 *     summary: Get or create a 1-1 direct conversation with a target user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Direct conversation returned (existing or newly created)
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/group:
 *   post:
 *     summary: Create a new group conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group conversation created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: List my conversations (sorted by latest message)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by group name
 *     responses:
 *       200:
 *         description: List of conversations with pagination meta
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Get conversation detail (only members can view)
 *     tags: [Conversations]
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
 *         description: Conversation detail with members
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this conversation
 *   patch:
 *     summary: Update group name/avatar (admin only)
 *     tags: [Conversations]
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
 *               name:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation updated
 *       400:
 *         description: Bad request (not a group / not admin)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/members:
 *   post:
 *     summary: Add members to a group conversation (admin only)
 *     tags: [Conversations]
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
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Members added
 *       400:
 *         description: Bad request (not a group / not admin)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a group conversation (admin only, or self)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/leave:
 *   post:
 *     summary: Leave a conversation
 *     tags: [Conversations]
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
 *         description: Left conversation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/mute:
 *   patch:
 *     summary: Mute/unmute a conversation for the current member
 *     tags: [Conversations]
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
 *               mutedUntil:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Pass null to unmute
 *     responses:
 *       200:
 *         description: Mute setting updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/archive:
 *   patch:
 *     summary: Archive/unarchive a conversation for the current member
 *     tags: [Conversations]
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
 *               - isArchived
 *             properties:
 *               isArchived:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Archive setting updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/invite/{code}:
 *   get:
 *     summary: Preview a group conversation by its invite code (no membership required)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite preview returned
 *       404:
 *         description: Invalid invite code
 */

/**
 * @swagger
 * /api/conversations/join/{code}:
 *   post:
 *     summary: Join a group conversation using an invite code
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined conversation
 *       400:
 *         description: Invalid invite code
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/invite-code:
 *   post:
 *     summary: Generate (or regenerate) the invite code for a group conversation (admin only)
 *     tags: [Conversations]
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
 *         description: Invite code generated
 *       400:
 *         description: Bad request (not a group / not admin)
 *       401:
 *         description: Unauthorized
 */

router.get('/invite/:code', authMiddleware, conversationController.getConversationByInviteCode);
router.post('/join/:code', authMiddleware, conversationController.joinByInviteCode);

router.post('/direct', authMiddleware, conversationController.createDirectConversation);
router.post('/group', authMiddleware, conversationController.createGroupConversation);
router.get('/', authMiddleware, conversationController.listMyConversations);
router.get('/:id', authMiddleware, conversationController.getConversationDetail);
router.post('/:id/invite-code', authMiddleware, conversationController.generateInviteCode);
router.patch('/:id', authMiddleware, conversationController.updateConversation);
router.post('/:id/members', authMiddleware, conversationController.addMembers);
router.delete('/:id/members/:userId', authMiddleware, conversationController.removeMember);
router.post('/:id/leave', authMiddleware, conversationController.leaveConversation);
router.patch('/:id/mute', authMiddleware, conversationController.muteConversation);
router.patch('/:id/archive', authMiddleware, conversationController.archiveConversation);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get message history of a conversation (cursor pagination)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Return messages older than this message id
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Return messages newer than this message id
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of messages with nextCursor
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this conversation
 *   post:
 *     summary: Send a message to a conversation
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
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [text, image, file, video, audio]
 *               content:
 *                 type: string
 *               attachmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               replyToMessageId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/read:
 *   post:
 *     summary: Mark a conversation as read up to a given message
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
 *               - lastReadMessageId
 *             properties:
 *               lastReadMessageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member read state updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/conversations/{id}/unread-count:
 *   get:
 *     summary: Get number of unread messages in a conversation
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
 *         description: Unread count returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this conversation
 */

/**
 * @swagger
 * /api/conversations/{id}/active-call:
 *   get:
 *     summary: Get the currently active call (ringing/ongoing) in a conversation, if any
 *     tags: [Calls]
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
 *         description: Active call returned (or null)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this conversation
 */

router.get('/:id/active-call', authMiddleware, callController.getActiveCall);

/**
 * @swagger
 * /api/conversations/{id}/attachments:
 *   get:
 *     summary: List media/file attachments shared in a conversation (cursor pagination)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, file]
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: List of attachments with nextCursor
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this conversation
 */

router.get('/:id/attachments', authMiddleware, conversationController.listAttachments);
router.get('/:id/pinned-messages', authMiddleware, messageController.getPinnedMessages);

router.get('/:id/messages', authMiddleware, messageController.listMessages);
router.post('/:id/messages', authMiddleware, sendMessageRateLimiter, messageController.sendMessage);
router.post('/:id/read', authMiddleware, messageController.markAsRead);
router.get('/:id/unread-count', authMiddleware, messageController.getUnreadCount);

export default router;
