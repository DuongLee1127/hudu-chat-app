import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import User from '@/models/user';

const getMembership = async (conversationId: string, userId: string) => {
  return ConversationMember.findOne({ conversationId, userId });
};

const assertMember = async (conversationId: string, userId: string) => {
  const membership = await getMembership(conversationId, userId);
  if (!membership) {
    throw new Error('Bạn không phải thành viên của hội thoại này!');
  }
  return membership;
};

const assertAdmin = async (conversationId: string, userId: string) => {
  const membership = await assertMember(conversationId, userId);
  if (membership.role !== 'admin') {
    throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này!');
  }
  return membership;
};

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
      if (!name || !name.trim()) {
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
        name: name.trim(),
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
        'conversationId isArchived mutedUntil',
      );
      const conversationIds = memberships.map((m) => m.conversationId);
      const settingByConversationId = new Map(
        memberships.map((m) => [
          String(m.conversationId),
          { isArchived: m.isArchived, mutedUntil: m.mutedUntil },
        ]),
      );

      const filter: any = { _id: { $in: conversationIds } };
      if (q) {
        filter.name = { $regex: q, $options: 'i' };
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

      const privateConversationIds = items
        .filter((c) => c.type === 'private')
        .map((c) => c._id);

      const otherMembers = privateConversationIds.length
        ? await ConversationMember.find({
            conversationId: { $in: privateConversationIds },
            userId: { $ne: userId },
          }).populate({ path: 'userId', select: '_id username avatar status' })
        : [];

      const otherMemberByConversationId = new Map(
        otherMembers.map((m) => [String(m.conversationId), m.userId]),
      );

      const enrichedItems = items.map((conversation) => ({
        ...conversation.toObject(),
        memberSetting: settingByConversationId.get(String(conversation._id)) || null,
        otherMember:
          conversation.type === 'private'
            ? otherMemberByConversationId.get(String(conversation._id)) || null
            : null,
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
      return { conversation, members };
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

      if (data.name !== undefined) conversation.name = data.name.trim();
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
};

export default conversationService;
