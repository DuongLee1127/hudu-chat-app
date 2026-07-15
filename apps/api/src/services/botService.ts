import bcrypt from 'bcrypt';
import User from '@/models/user';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import Message from '@/models/message';
import { assertMember } from '@/services/membershipService';
import { getIO } from '@/socket';
import { emitMessageCreated } from '@/socket/emitMessage';
import { logger } from '@/helpers/logger';

const BOT_EMAIL = 'bot@hudu.local';
const BOT_USERNAME = 'HuduBot';

export const ensureHuduBot = async () => {
  let bot = await User.findOne({ email: BOT_EMAIL });
  if (bot) return bot;

  const password = await bcrypt.hash(`bot-${Date.now()}`, 10);
  bot = await User.create({
    username: BOT_USERNAME,
    email: BOT_EMAIL,
    password,
    bio: 'Trợ lý AI của Hudu Chat',
    role: 'user',
    status: 'online',
  });
  return bot;
};

const callLLM = async (messages: Array<{ role: string; content: string }>) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return 'Xin chào! Tôi là HuduBot. Hiện chưa cấu hình AI_API_KEY nên tôi chỉ trả lời cố định. Hãy hỏi về cách dùng Hudu Chat: nhắn tin, nhóm, reaction, ghim tin, chuyển tiếp.';
  }

  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('AI request failed', text);
    return 'Xin lỗi, tôi chưa thể trả lời lúc này. Vui lòng thử lại sau.';
  }

  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'Không có phản hồi từ AI.';
};

const botService = {
  getOrCreateBotConversation: async (userId: string) => {
    const bot = await ensureHuduBot();
    const botId = String(bot._id);

    const myMemberships = await ConversationMember.find({ userId }).select('conversationId');
    const myIds = myMemberships.map((m) => m.conversationId);
    const privateConversations = await Conversation.find({
      _id: { $in: myIds },
      type: 'private',
    }).select('_id');
    const privateIds = privateConversations.map((c) => c._id);
    const existing = await ConversationMember.findOne({
      conversationId: { $in: privateIds },
      userId: botId,
    });

    if (existing) {
      const conversation = await Conversation.findById(existing.conversationId);
      const members = await ConversationMember.find({
        conversationId: existing.conversationId,
      }).populate({ path: 'userId', select: '_id username email avatar status bio' });
      return { conversation, members, bot };
    }

    const conversation = await Conversation.create({
      type: 'private',
      creatorId: userId,
      name: BOT_USERNAME,
    });
    await ConversationMember.insertMany([
      { conversationId: conversation._id, userId, role: 'member' },
      { conversationId: conversation._id, userId: botId, role: 'member' },
    ]);
    const members = await ConversationMember.find({ conversationId: conversation._id }).populate({
      path: 'userId',
      select: '_id username email avatar status bio',
    });
    return { conversation, members, bot };
  },

  maybeReplyAsBot: async (conversationId: string, userMessage: any) => {
    try {
      const bot = await ensureHuduBot();
      const botId = String(bot._id);
      if (String(userMessage.senderId?._id || userMessage.senderId) === botId) return;

      const botMember = await ConversationMember.findOne({ conversationId, userId: botId });
      if (!botMember) return;

      const history = await Message.find({ conversationId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate({ path: 'senderId', select: 'username' });

      const ordered = history.reverse();
      const llmMessages = [
        {
          role: 'system',
          content:
            'Bạn là HuduBot, trợ lý thân thiện trong ứng dụng chat Hudu. Trả lời ngắn gọn bằng tiếng Việt.',
        },
        ...ordered.map((m: any) => ({
          role: String(m.senderId?._id || m.senderId) === botId ? 'assistant' : 'user',
          content: m.content || `[${m.type}]`,
        })),
      ];

      const replyText = await callLLM(llmMessages);
      const message = await Message.create({
        conversationId,
        senderId: botId,
        content: replyText,
        type: 'text',
      });
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessageId: message._id,
        lastMessageAt: message.createdAt,
      });

      const populated = await Message.findById(message._id)
        .populate({ path: 'senderId', select: '_id username avatar' })
        .populate({ path: 'attachmentIds' });

      try {
        await emitMessageCreated(getIO(), conversationId, { message: populated });
      } catch {
        // socket may not be ready
      }
    } catch (error) {
      logger.error('botService.maybeReplyAsBot failed', error);
    }
  },

  summarizeConversation: async (userId: string, conversationId: string) => {
    await assertMember(conversationId, userId);
    const messages = await Message.find({ conversationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({ path: 'senderId', select: 'username' });

    if (messages.length === 0) {
      return { summary: 'Chưa có tin nhắn để tóm tắt.' };
    }

    const transcript = messages
      .reverse()
      .map((m: any) => `${m.senderId?.username || 'User'}: ${m.content || `[${m.type}]`}`)
      .join('\n');

    const summary = await callLLM([
      {
        role: 'system',
        content: 'Tóm tắt hội thoại chat bằng tiếng Việt, ngắn gọn, nêu các ý chính.',
      },
      { role: 'user', content: transcript },
    ]);

    return { summary };
  },
};

export default botService;
