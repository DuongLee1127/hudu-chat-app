import { Server } from 'socket.io';
import Notification from '@/models/notification';
import ConversationMember from '@/models/conversation_member';
import { logger } from '@/helpers/logger';
import { isUserOnline } from '@/socket/onlineUsers';
import { pushQueue } from '@/queues/pushQueue';

const isUserInConversationRoom = (io: Server, conversationId: string, userId: string) => {
  const room = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
  if (!room) return false;

  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket?.data?.user?.id && String(socket.data.user.id) === userId) {
      return true;
    }
  }
  return false;
};

const buildMessagePreview = (message: any) => {
  if (message.content?.trim()) {
    return message.content.trim().slice(0, 120);
  }
  switch (message.type) {
    case 'image':
      return 'Đã gửi một hình ảnh';
    case 'video':
      return 'Đã gửi một video';
    case 'audio':
      return 'Đã gửi một tệp âm thanh';
    case 'file':
      return 'Đã gửi một tệp đính kèm';
    default:
      return 'Đã gửi một tin nhắn';
  }
};

const notificationService = {
  // Create + push an in-app notification to every member who is not
  // actively viewing the conversation room when a new message arrives.
  notifyNewMessage: async (io: Server, message: any, conversationId: string, senderId: string) => {
    try {
      const members = await ConversationMember.find({
        conversationId,
        userId: { $ne: senderId },
      }).select('userId');

      if (members.length === 0) return;

      const senderName = message.senderId?.username || 'Ai đó';
      const content = `${senderName}: ${buildMessagePreview(message)}`;

      await Promise.all(
        members.map(async (member) => {
          const recipientId = String(member.userId);
          if (isUserInConversationRoom(io, conversationId, recipientId)) {
            return;
          }

          // Recipient isn't in the conversation's socket room (sidebar, another
          // chat, or another tab) — mirror message:created to their user room so
          // the conversations list can still reorder/preview in realtime.
          io.to(`user:${recipientId}`).emit('message:created', { message });

          const notification = await Notification.create({
            userId: recipientId,
            content,
            type: 'message',
            link: `/chat/${conversationId}`,
          });

          io.to(`user:${recipientId}`).emit('notification:new', { notification });

          if (!(await isUserOnline(recipientId))) {
            await pushQueue.add('send-push', {
              userId: recipientId,
              payload: {
                title: senderName,
                body: buildMessagePreview(message),
                link: `/chat/${conversationId}`,
              },
            });
          }
        }),
      );
    } catch (error) {
      logger.error('notificationService.notifyNewMessage failed', error);
    }
  },

  listNotifications: async (
    userId: string,
    options: { page?: number; pageSize?: number; unreadOnly?: boolean },
  ) => {
    try {
      const page = Math.max(1, Number(options.page) || 1);
      const pageSize = Math.max(1, Number(options.pageSize) || 20);
      const skip = (page - 1) * pageSize;

      const filter: any = { userId };
      if (options.unreadOnly) {
        filter.isRead = false;
      }

      const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, isRead: false }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        meta: { total, page, pageSize, totalPages, unreadCount },
      };
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (userId: string, notificationId: string) => {
    try {
      const notification = await Notification.findOne({ _id: notificationId, userId });
      if (!notification) {
        throw new Error('Không tìm thấy thông báo!');
      }

      if (!notification.isRead) {
        notification.isRead = true;
        await notification.save();
      }

      return notification;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Called whenever a user reads a conversation (whether they got there via the
  // notification bell or by navigating directly) so stale "unread" notifications
  // for that conversation don't linger.
  markConversationNotificationsAsRead: async (userId: string, conversationId: string) => {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false, link: `/chat/${conversationId}` },
        { isRead: true },
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw error;
    }
  },
};

export default notificationService;
