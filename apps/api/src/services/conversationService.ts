import crypto from 'crypto';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import Message from '@/models/message';
import User from '@/models/user';
import Block from '@/models/block';
import { assertMember, assertAdmin, getMembership } from '@/services/membershipService';
import { sanitizeText } from '@/helpers/sanitize';

const getMembersWithUser = async (conversationId: string) => {
  return ConversationMember.find({ conversationId }).populate({
    path: 'userId',
    select: '_id username email avatar status bio',
  });
};

const conversationService = {
  getOrCreateDirectConversation: async (userId: string, targetUserId: string) => {
    try {
      if (userId === targetUserId) {
        throw new Error('Không thể tạo hội thoại với chính mình!');
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new Error('Không tìm thấy người dùng!');
      }

      const myMemberships = await ConversationMember.find({ userId }).select('conversationId');
      const myConversationIds = myMemberships.map((m) => m.conversationId);

      const privateConversations = await Conversation.find({
        _id: { $in: myConversationIds },
        type: 'private',
      }).select('_id');
      const privateConversationIds = privateConversations.map((c) => c._id);

      const existingMembership = await ConversationMember.findOne({
        conversationId: { $in: privateConversationIds },
        userId: targetUserId,
      });

      if (existingMembership) {
        const conversation = await Conversation.findById(existingMembership.conversationId);
        const members = await getMembersWithUser(String(existingMembership.conversationId));
        return { conversation, members };
      }

      const conversation = await Conversation.create({
        type: 'private',
        creatorId: userId,
      });

      await ConversationMember.insertMany([
        { conversationId: conversation._id, userId, role: 'member' },
        { conversationId: conversation._id, userId: targetUserId, role: 'member' },
      ]);

      const members = await getMembersWithUser(String(conversation._id));
      return { conversation, members };
    } catch (error) {
      throw error;
    }
  },

  createGroupConversation: async (
    creatorId: string,
    name: string,
    memberIds: string[] = [],
    avatarUrl?: string,
  ) => {
    try {
      const sanitizedName = sanitizeText(name);
      if (!sanitizedName || !sanitizedName.trim()) {
        throw new Error('Tên nhóm không được để trống!');
      }

      const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== creatorId)));

      if (uniqueMemberIds.length > 0) {
        const existingUsersCount = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
        if (existingUsersCount !== uniqueMemberIds.length) {
          throw new Error('Một số người dùng được thêm vào không tồn tại!');
        }
      }

      const conversation = await Conversation.create({
        type: 'group',
        name: sanitizedName.trim(),
        avatar: avatarUrl || '',
        creatorId,
      });

      const memberDocs = [
        { conversationId: conversation._id, userId: creatorId, role: 'admin' as const },
        ...uniqueMemberIds.map((id) => ({
          conversationId: conversation._id,
          userId: id,
          role: 'member' as const,
        })),
      ];

      await ConversationMember.insertMany(memberDocs);

      const members = await getMembersWithUser(String(conversation._id));
      return { conversation, members };
    } catch (error) {
      throw error;
    }
  },

  listMyConversations: async (
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    q?: string,
  ) => {
    try {
      const memberships = await ConversationMember.find({ userId }).select(
        'conversationId isArchived mutedUntil lastReadMessageId',
      );
      const conversationIds = memberships.map((m) => m.conversationId);
      const settingByConversationId = new Map(
        memberships.map((m) => [
          String(m.conversationId),
          { isArchived: m.isArchived, mutedUntil: m.mutedUntil },
        ]),
      );
      const lastReadMessageIdByConversationId = new Map(
        memberships.map((m) => [String(m.conversationId), m.lastReadMessageId]),
      );

      let filter: any = { _id: { $in: conversationIds } };
      if (q && q.trim()) {
        const queryRegex = { $regex: q.trim(), $options: 'i' };

        // 1. Find users whose username matches query
        const matchingUsers = await User.find({ username: queryRegex }).select('_id');
        const matchingUserIds = matchingUsers.map((u) => u._id);

        // 2. Find private conversations containing any matching user
        const matchingMemberships = matchingUserIds.length
          ? await ConversationMember.find({
              conversationId: { $in: conversationIds },
              userId: { $in: matchingUserIds },
            }).select('conversationId')
          : [];
        const matchingConvIdsFromUsers = matchingMemberships.map((m) => m.conversationId);

        // 3. Find messages matching content
        const matchingMessages = await Message.find({
          conversationId: { $in: conversationIds },
          content: queryRegex,
          isDeleted: false,
        }).select('conversationId');
        const matchingConvIdsFromMessages = matchingMessages.map((m) => m.conversationId);

        const matchedConvIds = Array.from(
          new Set([
            ...matchingConvIdsFromUsers.map(String),
            ...matchingConvIdsFromMessages.map(String),
          ]),
        );

        filter = {
          _id: { $in: conversationIds },
          $or: [{ name: queryRegex }, { _id: { $in: matchedConvIds } }],
        };
      }

      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        Conversation.find(filter)
          .sort({ lastMessageAt: -1, updatedAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .exec(),
        Conversation.countDocuments(filter),
      ]);

      const privateConversationIds = items.filter((c) => c.type === 'private').map((c) => c._id);

      const otherMembers = privateConversationIds.length
        ? await ConversationMember.find({
            conversationId: { $in: privateConversationIds },
            userId: { $ne: userId },
          }).populate({ path: 'userId', select: '_id username avatar status' })
        : [];

      const otherMemberByConversationId = new Map(
        otherMembers.map((m) => [String(m.conversationId), m.userId]),
      );

      const lastMessageIds = items
        .map((c) => c.lastMessageId)
        .filter((id): id is NonNullable<typeof id> => Boolean(id));
      const lastMessages = lastMessageIds.length
        ? await Message.find({ _id: { $in: lastMessageIds } })
            .select('_id content type senderId isDeleted createdAt')
            .populate({ path: 'senderId', select: '_id username' })
        : [];
      const lastMessageById = new Map(lastMessages.map((m) => [String(m._id), m]));

      const unreadCounts = await Promise.all(
        items.map((conversation) => {
          const lastReadMessageId = lastReadMessageIdByConversationId.get(String(conversation._id));
          const unreadFilter: any = {
            conversationId: conversation._id,
            isDeleted: false,
            senderId: { $ne: userId },
          };
          if (lastReadMessageId) {
            unreadFilter._id = { $gt: lastReadMessageId };
          }
          return Message.countDocuments(unreadFilter);
        }),
      );

      const enrichedItems = items.map((conversation, index) => ({
        ...conversation.toObject(),
        memberSetting: settingByConversationId.get(String(conversation._id)) || null,
        otherMember:
          conversation.type === 'private'
            ? otherMemberByConversationId.get(String(conversation._id)) || null
            : null,
        lastMessage: conversation.lastMessageId
          ? lastMessageById.get(String(conversation.lastMessageId)) || null
          : null,
        unreadCount: unreadCounts[index],
      }));

      const totalPages = Math.ceil(total / pageSize);

      return {
        items: enrichedItems,
        meta: { total, page, pageSize, totalPages },
      };
    } catch (error) {
      throw error;
    }
  },

  getConversationDetail: async (userId: string, conversationId: string) => {
    try {
      await assertMember(conversationId, userId);

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy hội thoại!');
      }

      const members = await getMembersWithUser(conversationId);

      let blockedByOther = false;
      if (conversation.type === 'private') {
        const otherMember = members.find((m) => String((m.userId as any)._id) !== userId);
        if (otherMember) {
          blockedByOther = !!(await Block.exists({
            userId: (otherMember.userId as any)._id,
            blockedUserId: userId,
          }));
        }
      }

      return { conversation, members, blockedByOther };
    } catch (error) {
      throw error;
    }
  },

  updateConversation: async (
    userId: string,
    conversationId: string,
    data: { name?: string; avatarUrl?: string },
  ) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy hội thoại!');
      }
      if (conversation.type !== 'group') {
        throw new Error('Chỉ nhóm chat mới có thể cập nhật tên/ảnh đại diện!');
      }

      await assertAdmin(conversationId, userId);

      if (data.name !== undefined) conversation.name = sanitizeText(data.name).trim();
      if (data.avatarUrl !== undefined) conversation.avatar = data.avatarUrl;
      await conversation.save();

      return conversation;
    } catch (error) {
      throw error;
    }
  },

  addMembers: async (userId: string, conversationId: string, userIds: string[] = []) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy hội thoại!');
      }
      if (conversation.type !== 'group') {
        throw new Error('Chỉ nhóm chat mới có thể thêm thành viên!');
      }

      await assertAdmin(conversationId, userId);

      const existingMembers = await ConversationMember.find({ conversationId }).select('userId');
      const existingMemberIds = new Set(existingMembers.map((m) => String(m.userId)));

      const newUserIds = Array.from(new Set(userIds)).filter((id) => !existingMemberIds.has(id));
      if (newUserIds.length === 0) {
        return getMembersWithUser(conversationId);
      }

      const existingUsersCount = await User.countDocuments({ _id: { $in: newUserIds } });
      if (existingUsersCount !== newUserIds.length) {
        throw new Error('Một số người dùng được thêm vào không tồn tại!');
      }

      await ConversationMember.insertMany(
        newUserIds.map((id) => ({ conversationId, userId: id, role: 'member' as const })),
      );

      return getMembersWithUser(conversationId);
    } catch (error) {
      throw error;
    }
  },

  removeMember: async (userId: string, conversationId: string, targetUserId: string) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy hội thoại!');
      }
      if (conversation.type !== 'group') {
        throw new Error('Chỉ nhóm chat mới có thể xóa thành viên!');
      }

      if (userId !== targetUserId) {
        await assertAdmin(conversationId, userId);
      } else {
        await assertMember(conversationId, userId);
      }

      const result = await ConversationMember.deleteOne({ conversationId, userId: targetUserId });
      if (result.deletedCount === 0) {
        throw new Error('Người dùng không phải thành viên của hội thoại này!');
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  leaveConversation: async (userId: string, conversationId: string) => {
    try {
      await assertMember(conversationId, userId);
      await ConversationMember.deleteOne({ conversationId, userId });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  muteConversation: async (userId: string, conversationId: string, mutedUntil: Date | null) => {
    try {
      const membership = await assertMember(conversationId, userId);
      membership.mutedUntil = mutedUntil;
      await membership.save();
      return membership;
    } catch (error) {
      throw error;
    }
  },

  archiveConversation: async (userId: string, conversationId: string, isArchived: boolean) => {
    try {
      const membership = await assertMember(conversationId, userId);
      membership.isArchived = isArchived;
      await membership.save();
      return membership;
    } catch (error) {
      throw error;
    }
  },

  generateInviteCode: async (userId: string, conversationId: string) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy hội thoại!');
      }
      if (conversation.type !== 'group') {
        throw new Error('Chỉ nhóm chat mới có thể tạo mã mời!');
      }

      await assertAdmin(conversationId, userId);

      conversation.inviteCode = crypto.randomBytes(9).toString('base64url');
      await conversation.save();

      return conversation;
    } catch (error) {
      throw error;
    }
  },

  getConversationByInviteCode: async (inviteCode: string) => {
    try {
      const conversation = await Conversation.findOne({ inviteCode });
      if (!conversation) {
        throw new Error('Mã mời không hợp lệ hoặc đã hết hạn!');
      }

      const memberCount = await ConversationMember.countDocuments({
        conversationId: conversation._id,
      });

      return {
        _id: conversation._id,
        name: conversation.name,
        avatar: conversation.avatar,
        memberCount,
      };
    } catch (error) {
      throw error;
    }
  },

  joinByInviteCode: async (userId: string, inviteCode: string) => {
    try {
      const conversation = await Conversation.findOne({ inviteCode });
      if (!conversation) {
        throw new Error('Mã mời không hợp lệ hoặc đã hết hạn!');
      }

      const existingMembership = await getMembership(String(conversation._id), userId);
      if (!existingMembership) {
        await ConversationMember.create({
          conversationId: conversation._id,
          userId,
          role: 'member',
        });
      }

      const members = await getMembersWithUser(String(conversation._id));
      return { conversation, members };
    } catch (error) {
      throw error;
    }
  },
};

export default conversationService;
