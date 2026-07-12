import mongoose from 'mongoose';
import Message from '@/models/message';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import userService from '@/services/userService';
import { assertMember } from '@/services/membershipService';

const clampLimit = (limit?: number, max: number = 50, fallback: number = 20) =>
  Math.min(Math.max(Number(limit) || fallback, 1), max);

const searchService = {
  // Only searches messages within conversations the requesting user is a member of.
  searchMessages: async (
    userId: string,
    options: { conversationId?: string; q: string; limit?: number },
  ) => {
    try {
      const q = options.q?.trim();
      if (!q) return { items: [] };

      const limit = clampLimit(options.limit, 50, 20);

      let conversationIds: mongoose.Types.ObjectId[];
      if (options.conversationId) {
        await assertMember(options.conversationId, userId);
        conversationIds = [new mongoose.Types.ObjectId(options.conversationId)];
      } else {
        const memberships = await ConversationMember.find({ userId }).select('conversationId');
        conversationIds = memberships.map((m) => m.conversationId as mongoose.Types.ObjectId);
      }

      if (conversationIds.length === 0) return { items: [] };

      const items = await Message.find(
        {
          conversationId: { $in: conversationIds },
          isDeleted: false,
          $text: { $search: q },
        },
        { score: { $meta: 'textScore' } },
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .populate({ path: 'senderId', select: '_id username avatar' })
        .populate({ path: 'conversationId', select: '_id name type' })
        .exec();

      return { items };
    } catch (error) {
      throw error;
    }
  },

  // Only searches conversations the requesting user is a member of.
  searchConversations: async (userId: string, q: string, limit?: number) => {
    try {
      const keyword = q?.trim();
      const memberships = await ConversationMember.find({ userId }).select('conversationId');
      const conversationIds = memberships.map((m) => m.conversationId);
      if (conversationIds.length === 0) return { items: [] };

      const filter: any = { _id: { $in: conversationIds } };
      if (keyword) {
        filter.name = { $regex: keyword, $options: 'i' };
      }

      const items = await Conversation.find(filter)
        .sort({ lastMessageAt: -1 })
        .limit(clampLimit(limit, 50, 20))
        .exec();

      return { items };
    } catch (error) {
      throw error;
    }
  },

  searchGlobal: async (userId: string, q: string) => {
    try {
      const keyword = q?.trim();
      if (!keyword) {
        return { users: [], conversations: [], messages: [] };
      }

      const [usersResult, conversationsResult, messagesResult] = await Promise.all([
        userService.searchUsers(userId, keyword, 1, 5),
        searchService.searchConversations(userId, keyword, 5),
        searchService.searchMessages(userId, { q: keyword, limit: 5 }),
      ]);

      return {
        users: usersResult.items,
        conversations: conversationsResult.items,
        messages: messagesResult.items,
      };
    } catch (error) {
      throw error;
    }
  },
};

export default searchService;
