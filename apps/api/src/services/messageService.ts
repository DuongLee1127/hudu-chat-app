import mongoose from 'mongoose';
import Message from '@/models/message';
import Attachment from '@/models/attachment';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import User from '@/models/user';
import Block from '@/models/block';
import { assertMember, assertAdmin } from '@/services/membershipService';
import { sanitizeText } from '@/helpers/sanitize';

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 phút

const populateMessage = (query: any) =>
  query
    .populate({ path: 'senderId', select: '_id username avatar' })
    .populate({ path: 'pinnedById', select: '_id username avatar' })
    .populate({ path: 'attachmentIds' })
    .populate({
      path: 'replyToMessageId',
      select: '_id content senderId type isDeleted',
      populate: { path: 'senderId', select: '_id username' },
    });

const messageService = {
  listMessages: async (
    userId: string,
    conversationId: string,
    options: { before?: string; after?: string; limit?: number },
  ) => {
    try {
      await assertMember(conversationId, userId);

      const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
      const filter: any = { conversationId, isDeleted: false };

      if (options.after) {
        filter._id = { $gt: new mongoose.Types.ObjectId(options.after) };
      } else if (options.before) {
        filter._id = { $lt: new mongoose.Types.ObjectId(options.before) };
      }

      const sortDirection = options.after ? 1 : -1;

      const docs = await populateMessage(
        Message.find(filter).sort({ _id: sortDirection }).limit(limit),
      ).exec();

      const hasMore = docs.length === limit;
      const nextCursor = hasMore ? String(docs[docs.length - 1]._id) : null;
      const items = sortDirection === 1 ? docs : docs.slice().reverse();

      return { items, nextCursor };
    } catch (error) {
      throw error;
    }
  },

  sendMessage: async (
    userId: string,
    conversationId: string,
    data: {
      type?: 'text' | 'image' | 'file' | 'video' | 'audio';
      content?: string;
      attachmentIds?: string[];
      replyToMessageId?: string;
    },
  ) => {
    try {
      await assertMember(conversationId, userId);

      const sender = await User.findById(userId).select('accountStatus');
      if (sender?.accountStatus === 'locked') {
        throw new Error('Tài khoản của bạn đã bị khóa, không thể gửi tin nhắn!');
      }

      const conversation = await Conversation.findById(conversationId).select('type');
      if (conversation?.type === 'private') {
        const otherMember = await ConversationMember.findOne({
          conversationId,
          userId: { $ne: userId },
        }).select('userId');

        if (otherMember) {
          const blockExists = await Block.exists({
            $or: [
              { userId: otherMember.userId, blockedUserId: userId },
              { userId, blockedUserId: otherMember.userId },
            ],
          });
          if (blockExists) {
            throw new Error('Không thể gửi tin nhắn vì bạn hoặc người này đã chặn nhau!');
          }
        }
      }

      const content = sanitizeText(data.content);
      const attachmentIds = Array.from(new Set(data.attachmentIds || []));
      if (!content?.trim() && attachmentIds.length === 0) {
        throw new Error('Nội dung tin nhắn không được để trống!');
      }

      if (attachmentIds.length > 0) {
        const count = await Attachment.countDocuments({
          _id: { $in: attachmentIds },
          uploaderId: userId,
          messageId: null,
        });
        if (count !== attachmentIds.length) {
          throw new Error('Một số tệp đính kèm không hợp lệ hoặc đã được sử dụng!');
        }
      }

      if (data.replyToMessageId) {
        const replyMessage = await Message.findOne({
          _id: data.replyToMessageId,
          conversationId,
          isDeleted: false,
        });
        if (!replyMessage) {
          throw new Error('Tin nhắn được trả lời không tồn tại!');
        }
      }

      const message = await Message.create({
        conversationId,
        senderId: userId,
        content: content?.trim() || '',
        type: data.type || 'text',
        attachmentIds,
        replyToMessageId: data.replyToMessageId || undefined,
      });

      if (attachmentIds.length > 0) {
        await Attachment.updateMany({ _id: { $in: attachmentIds } }, { messageId: message._id });
      }

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessageId: message._id,
        lastMessageAt: message.createdAt,
      });

      await ConversationMember.updateOne(
        { conversationId, userId },
        { lastReadMessageId: message._id, lastReadAt: message.createdAt },
      );

      const populated = await populateMessage(Message.findById(message._id)).exec();
      return populated;
    } catch (error) {
      throw error;
    }
  },

  createSystemMessage: async (conversationId: string, senderId: string, content: string) => {
    try {
      const message = await Message.create({
        conversationId,
        senderId,
        content,
        type: 'system',
        attachmentIds: [],
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessageId: message._id,
        lastMessageAt: message.createdAt,
      });

      return populateMessage(Message.findById(message._id)).exec();
    } catch (error) {
      throw error;
    }
  },

  editMessage: async (userId: string, messageId: string, content: string) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.isDeleted) {
        throw new Error('Không tìm thấy tin nhắn!');
      }
      if (String(message.senderId) !== userId) {
        throw new Error('Bạn không có quyền sửa tin nhắn này!');
      }
      if (message.type === 'system') {
        throw new Error('Không thể sửa tin nhắn hệ thống!');
      }
      if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
        throw new Error('Đã hết thời gian cho phép sửa tin nhắn!');
      }
      const sanitizedContent = sanitizeText(content);
      if (!sanitizedContent?.trim()) {
        throw new Error('Nội dung tin nhắn không được để trống!');
      }

      message.content = sanitizedContent.trim();
      message.isEdited = true;
      await message.save();

      return populateMessage(Message.findById(message._id)).exec();
    } catch (error) {
      throw error;
    }
  },

  deleteMessage: async (userId: string, messageId: string) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.isDeleted) {
        throw new Error('Không tìm thấy tin nhắn!');
      }

      if (String(message.senderId) !== userId) {
        await assertAdmin(String(message.conversationId), userId);
      }

      message.isDeleted = true;
      message.content = '';
      message.attachmentIds = [];
      await message.save();

      return {
        success: true,
        conversationId: String(message.conversationId),
        messageId: String(message._id),
      };
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (userId: string, conversationId: string, lastReadMessageId: string) => {
    try {
      const membership = await assertMember(conversationId, userId);

      const message = await Message.findOne({ _id: lastReadMessageId, conversationId });
      if (!message) {
        throw new Error('Tin nhắn không tồn tại trong hội thoại này!');
      }

      membership.lastReadMessageId = message._id as mongoose.Types.ObjectId;
      membership.lastReadAt = message.createdAt;
      await membership.save();

      return membership;
    } catch (error) {
      throw error;
    }
  },

  getUnreadCount: async (userId: string, conversationId: string) => {
    try {
      const membership = await assertMember(conversationId, userId);

      const filter: any = {
        conversationId,
        isDeleted: false,
        senderId: { $ne: userId },
      };

      if (membership.lastReadMessageId) {
        filter._id = { $gt: membership.lastReadMessageId };
      }

      const unreadCount = await Message.countDocuments(filter);
      return { unreadCount };
    } catch (error) {
      throw error;
    }
  },

  togglePinMessage: async (userId: string, messageId: string) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.isDeleted) {
        throw new Error('Tin nhắn không tồn tại!');
      }

      const conversationId = String(message.conversationId);
      await assertMember(conversationId, userId);

      const user = await User.findById(userId).select('username');
      const isPinning = !message.isPinned;

      // Enforce max 5 pinned messages per conversation
      if (isPinning) {
        const currentPinnedCount = await Message.countDocuments({
          conversationId,
          isPinned: true,
          isDeleted: false,
        });
        if (currentPinnedCount >= 5) {
          throw new Error('Mỗi cuộc trò chuyện chỉ được ghim tối đa 5 tin nhắn!');
        }
      }

      message.isPinned = isPinning;
      message.pinnedAt = isPinning ? new Date() : undefined;
      message.pinnedById = isPinning ? (new mongoose.Types.ObjectId(userId) as any) : undefined;
      await message.save();

      // Create a system notification message if pinning
      if (isPinning && user) {
        await messageService.createSystemMessage(
          conversationId,
          userId,
          `${user.username || 'Người dùng'} đã ghim một tin nhắn`,
        );
      }

      const updated = await populateMessage(Message.findById(message._id)).exec();
      return updated;
    } catch (error) {
      throw error;
    }
  },

  getPinnedMessages: async (userId: string, conversationId: string) => {
    try {
      await assertMember(conversationId, userId);

      const pinnedMessages = await populateMessage(
        Message.find({
          conversationId,
          isPinned: true,
          isDeleted: false,
        }).sort({ pinnedAt: -1 }),
      ).exec();

      return pinnedMessages;
    } catch (error) {
      throw error;
    }
  },
};

export default messageService;
