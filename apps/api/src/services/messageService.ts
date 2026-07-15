import mongoose from 'mongoose';
import Message from '@/models/message';
import Attachment from '@/models/attachment';
import Block from '@/models/block';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import User from '@/models/user';
import { assertMember, assertAdmin } from '@/services/membershipService';
import { sanitizeText } from '@/helpers/sanitize';
import { getLinkPreview } from '@/helpers/linkPreview';

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 phút

const populateMessage = (query: any) =>
  query
    .populate({ path: 'senderId', select: '_id username avatar' })
    .populate({ path: 'attachmentIds' })
    .populate({ path: 'reactions.userId', select: '_id username avatar' })
    .populate({ path: 'replyToMessageId', select: '_id content senderId type isDeleted' });

/** Chặn gửi tin trong DM nếu một trong hai phía đã chặn nhau */
const assertNotBlockedInPrivateChat = async (conversationId: string, userId: string) => {
  const conversation = await Conversation.findById(conversationId).select('type');
  if (!conversation || conversation.type !== 'private') return;

  const members = await ConversationMember.find({ conversationId }).select('userId').lean();
  const otherUserId = members
    .map((m) => String(m.userId))
    .find((id) => id !== userId);

  if (!otherUserId) return;

  const blocked = await Block.findOne({
    $or: [
      { userId, blockedUserId: otherUserId },
      { userId: otherUserId, blockedUserId: userId },
    ],
  }).lean();

  if (blocked) {
    throw new Error('Không thể gửi tin nhắn vì một trong hai đã chặn nhau!');
  }
};

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
      await assertNotBlockedInPrivateChat(conversationId, userId);

      const sender = await User.findById(userId).select('accountStatus');
      if (sender?.accountStatus === 'locked') {
        throw new Error('Tài khoản của bạn đã bị khóa, không thể gửi tin nhắn!');
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

      const normalizedContent = content?.trim() || '';
      const mentionedUsernames = Array.from(
        new Set(
          Array.from(normalizedContent.matchAll(/@([a-zA-Z0-9_]+)/g), (match) => match[1].toLowerCase()),
        ),
      );
      const [memberships, linkPreview] = await Promise.all([
        mentionedUsernames.length
          ? ConversationMember.find({ conversationId }).select('userId').lean()
          : Promise.resolve([]),
        data.type !== 'text' && data.type !== undefined
          ? Promise.resolve(null)
          : getLinkPreview(normalizedContent),
      ]);
      const memberIds = memberships.map((membership) => membership.userId);
      const mentionedUsers = memberIds.length
        ? await User.find({
            _id: { $in: memberIds },
            username: { $in: mentionedUsernames.map((username) => new RegExp(`^${username}$`, 'i')) },
          }).select('_id')
        : [];

      const message = await Message.create({
        conversationId,
        senderId: userId,
        content: normalizedContent,
        type: data.type || 'text',
        attachmentIds,
        replyToMessageId: data.replyToMessageId || undefined,
        mentionedUserIds: mentionedUsers.map((user) => user._id),
        linkPreview: linkPreview || undefined,
      });

      if (attachmentIds.length > 0) {
        await Attachment.updateMany(
          { _id: { $in: attachmentIds } },
          { messageId: message._id },
        );
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

      return { success: true, conversationId: String(message.conversationId), messageId: String(message._id) };
    } catch (error) {
      throw error;
    }
  },

  toggleReaction: async (userId: string, messageId: string, emoji: string) => {
    const normalizedEmoji = emoji?.trim();
    if (!normalizedEmoji || normalizedEmoji.length > 16) {
      throw new Error('Biểu tượng cảm xúc không hợp lệ!');
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      throw new Error('Không tìm thấy tin nhắn!');
    }
    await assertMember(String(message.conversationId), userId);

    const existingIndex = message.reactions.findIndex((reaction) => String(reaction.userId) === userId);
    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === normalizedEmoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = normalizedEmoji;
      }
    } else {
      message.reactions.push({ emoji: normalizedEmoji, userId: new mongoose.Types.ObjectId(userId) });
    }
    await message.save();
    return populateMessage(Message.findById(message._id)).exec();
  },

  forwardMessage: async (userId: string, messageId: string, targetConversationIds: string[] = []) => {
    const source = await Message.findById(messageId);
    if (!source || source.isDeleted) {
      throw new Error('Không tìm thấy tin nhắn!');
    }
    await assertMember(String(source.conversationId), userId);

    const targets = Array.from(new Set(targetConversationIds.map(String).filter(Boolean)));
    if (targets.length === 0) {
      throw new Error('Hãy chọn ít nhất một hội thoại để chuyển tiếp!');
    }

    await Promise.all(targets.map((conversationId) => assertMember(conversationId, userId)));
    const created = await Promise.all(
      targets.map(async (conversationId) => {
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content: source.content,
          type: source.type,
          attachmentIds: source.attachmentIds,
        });
        await Promise.all([
          Conversation.findByIdAndUpdate(conversationId, {
            lastMessageId: message._id,
            lastMessageAt: message.createdAt,
          }),
          ConversationMember.updateOne(
            { conversationId, userId },
            { lastReadMessageId: message._id, lastReadAt: message.createdAt },
          ),
        ]);
        return populateMessage(Message.findById(message._id)).exec();
      }),
    );

    return created;
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

  markAsDelivered: async (userId: string, messageId: string) => {
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      throw new Error('Không tìm thấy tin nhắn!');
    }
    await assertMember(String(message.conversationId), userId);
    if (String(message.senderId) === userId) {
      throw new Error('Không thể đánh dấu đã nhận tin nhắn của chính bạn!');
    }

    await Message.updateOne({ _id: messageId }, { $addToSet: { deliveredTo: userId } });
    return { conversationId: String(message.conversationId), messageId };
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

  createPoll: async (
    userId: string,
    conversationId: string,
    question: string,
    options: string[],
  ) => {
    await assertMember(conversationId, userId);
    await assertNotBlockedInPrivateChat(conversationId, userId);
    const cleanedQuestion = question.trim();
    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!cleanedQuestion) throw new Error('Câu hỏi không được để trống!');
    if (cleanedOptions.length < 2) throw new Error('Cần ít nhất 2 lựa chọn!');
    if (cleanedOptions.length > 8) throw new Error('Tối đa 8 lựa chọn!');

    const Poll = (await import('@/models/poll')).default;
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content: cleanedQuestion,
      type: 'poll',
    });

    await Poll.create({
      conversationId,
      messageId: message._id,
      question: cleanedQuestion,
      options: cleanedOptions.map((text) => ({ text, voterIds: [] })),
      createdBy: userId,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageId: message._id,
      lastMessageAt: message.createdAt,
    });

    return populateMessage(Message.findById(message._id)).exec();
  },

  votePoll: async (userId: string, messageId: string, optionIndex: number) => {
    const Poll = (await import('@/models/poll')).default;
    const message = await Message.findById(messageId);
    if (!message || message.type !== 'poll' || message.isDeleted) {
      throw new Error('Không tìm thấy bình chọn!');
    }
    await assertMember(String(message.conversationId), userId);

    const poll = await Poll.findOne({ messageId });
    if (!poll) throw new Error('Không tìm thấy bình chọn!');
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new Error('Lựa chọn không hợp lệ!');
    }

    poll.options.forEach((opt) => {
      opt.voterIds = opt.voterIds.filter((id) => String(id) !== userId) as any;
    });
    poll.options[optionIndex].voterIds.push(userId as any);
    await poll.save();

    return { poll, message: await populateMessage(Message.findById(messageId)).exec() };
  },

  getPollByMessageId: async (userId: string, messageId: string) => {
    const Poll = (await import('@/models/poll')).default;
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Không tìm thấy tin nhắn!');
    await assertMember(String(message.conversationId), userId);
    const poll = await Poll.findOne({ messageId });
    if (!poll) throw new Error('Không tìm thấy bình chọn!');
    return poll;
  },
};

export default messageService;
