import { Request, Response } from 'express';
import conversationService from '@/services/conversationService';
import attachmentService from '@/services/attachmentService';
import { sendSuccess, sendError } from '@/helpers';

const conversationController = {
  createDirectConversation: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        return sendError(res, 'targetUserId is required', 400);
      }

      const result = await conversationService.getOrCreateDirectConversation(
        String(userId),
        String(targetUserId),
      );
      return sendSuccess(res, result, 'Get or create direct conversation success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  createGroupConversation: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { name, memberIds, avatarUrl } = req.body;
      if (!name) {
        return sendError(res, 'name is required', 400);
      }

      const result = await conversationService.createGroupConversation(
        String(userId),
        String(name),
        Array.isArray(memberIds) ? memberIds.map(String) : [],
        avatarUrl,
      );
      return sendSuccess(res, result, 'Create group conversation success', 201);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  listMyConversations: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.max(1, Number(req.query.pageSize) || 20);
      const q = req.query.q ? String(req.query.q) : undefined;

      const result = await conversationService.listMyConversations(
        String(userId),
        page,
        pageSize,
        q,
      );
      return sendSuccess(res, result, 'Get my conversations success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  getConversationDetail: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const result = await conversationService.getConversationDetail(String(userId), String(id));
      return sendSuccess(res, result, 'Get conversation detail success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },

  updateConversation: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const { name, avatarUrl } = req.body;
      const result = await conversationService.updateConversation(String(userId), String(id), {
        name,
        avatarUrl,
      });
      return sendSuccess(res, result, 'Update conversation success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  addMembers: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const { userIds } = req.body;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return sendError(res, 'userIds is required', 400);
      }

      const members = await conversationService.addMembers(
        String(userId),
        String(id),
        userIds.map(String),
      );
      return sendSuccess(res, { members }, 'Add members success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  removeMember: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id, userId: targetUserId } = req.params;
      if (!id || !targetUserId) {
        return sendError(res, 'Conversation ID and userId are required', 400);
      }

      const result = await conversationService.removeMember(
        String(userId),
        String(id),
        String(targetUserId),
      );
      return sendSuccess(res, result, 'Remove member success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  leaveConversation: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const result = await conversationService.leaveConversation(String(userId), String(id));
      return sendSuccess(res, result, 'Leave conversation success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  muteConversation: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const { mutedUntil } = req.body;
      const result = await conversationService.muteConversation(
        String(userId),
        String(id),
        mutedUntil ? new Date(mutedUntil) : null,
      );
      return sendSuccess(res, { memberSetting: result }, 'Update mute setting success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  archiveConversation: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const { isArchived } = req.body;
      const result = await conversationService.archiveConversation(
        String(userId),
        String(id),
        Boolean(isArchived),
      );
      return sendSuccess(res, { memberSetting: result }, 'Update archive setting success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  generateInviteCode: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const result = await conversationService.generateInviteCode(String(userId), String(id));
      return sendSuccess(res, result, 'Generate invite code success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  getConversationByInviteCode: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      if (!code) {
        return sendError(res, 'Invite code is required', 400);
      }

      const result = await conversationService.getConversationByInviteCode(String(code));
      return sendSuccess(res, result, 'Get invite preview success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 404);
    }
  },

  joinByInviteCode: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { code } = req.params;
      if (!code) {
        return sendError(res, 'Invite code is required', 400);
      }

      const result = await conversationService.joinByInviteCode(String(userId), String(code));
      return sendSuccess(res, result, 'Join conversation success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 400);
    }
  },

  listAttachments: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Conversation ID is required', 400);
      }

      const type = req.query.type as 'image' | 'video' | 'file' | undefined;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await attachmentService.listByConversation(String(userId), String(id), {
        type,
        cursor,
        limit,
      });
      return sendSuccess(res, result, 'Get conversation attachments success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 403);
    }
  },
};

export default conversationController;
