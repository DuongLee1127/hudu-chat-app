import mongoose from 'mongoose';
import Message from '@/models/message';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import friendService from '@/services/friendService';
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

      const regex = { $regex: keyword, $options: 'i' };

      // 1. Search Accepted Friends only
      const friendsResult = await friendService.getFriends(userId, keyword, 1, 10);
      const foundUserIds = friendsResult.items.map((u) => String(u._id));

      // Find existing private conversations between current user and found friends
      const myMemberships = await ConversationMember.find({ userId }).select('conversationId');
      const myConvIds = myMemberships.map((m) => m.conversationId);

      const privateConvs = myConvIds.length
        ? await Conversation.find({ _id: { $in: myConvIds }, type: 'private' }).select('_id')
        : [];
      const privateConvIds = privateConvs.map((c) => c._id);

      const existingMemberships =
        privateConvIds.length && foundUserIds.length
          ? await ConversationMember.find({
              conversationId: { $in: privateConvIds },
              userId: { $in: foundUserIds },
            })
          : [];

      const convIdByUserId = new Map(
        existingMemberships.map((m) => [String(m.userId), String(m.conversationId)]),
      );

      const enrichedUsers = friendsResult.items.map((u) => ({
        ...u.toObject(),
        conversationId: convIdByUserId.get(String(u._id)) || null,
      }));

      // 2. Search Group Conversations
      const groupConvs = myConvIds.length
        ? await Conversation.find({
            _id: { $in: myConvIds },
            type: 'group',
            name: regex,
          })
            .sort({ lastMessageAt: -1 })
            .limit(10)
        : [];

      // 3. Search Messages (fallback to regex search for max reliability)
      const messages = myConvIds.length
        ? await Message.find({
            conversationId: { $in: myConvIds },
            isDeleted: false,
            content: regex,
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({ path: 'senderId', select: '_id username avatar' })
            .populate({ path: 'conversationId', select: '_id name type avatar' })
        : [];

      return {
        users: enrichedUsers,
        conversations: groupConvs,
        messages,
      };
    } catch (error) {
      throw error;
    }
  },
};

export default searchService;
