import axiosClient from '@/api/axiosClient';
import type {
  Message,
  ListMessagesParams,
  ListMessagesResult,
  SendMessagePayload,
} from '@/types/message';
import type { ConversationMember } from '@/types/conversation';
import type { ApiResponse } from '@/types/api';

export const messageService = {
  listMessages: async (conversationId: string, params: ListMessagesParams = {}) => {
    return axiosClient.get<never, ApiResponse<ListMessagesResult>>(
      `/conversations/${conversationId}/messages`,
      { params },
    );
  },
  sendMessage: async (conversationId: string, payload: SendMessagePayload) => {
    return axiosClient.post<never, ApiResponse<{ message: Message }>>(
      `/conversations/${conversationId}/messages`,
      payload,
    );
  },
  editMessage: async (id: string, content: string) => {
    return axiosClient.patch<never, ApiResponse<{ message: Message }>>(`/messages/${id}`, {
      content,
    });
  },
  deleteMessage: async (id: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(`/messages/${id}`);
  },
  markAsRead: async (conversationId: string, lastReadMessageId: string) => {
    return axiosClient.post<never, ApiResponse<{ memberSetting: ConversationMember }>>(
      `/conversations/${conversationId}/read`,
      { lastReadMessageId },
    );
  },
  getUnreadCount: async (conversationId: string) => {
    return axiosClient.get<never, ApiResponse<{ unreadCount: number }>>(
      `/conversations/${conversationId}/unread-count`,
    );
  },
  getPinnedMessages: async (conversationId: string) => {
    return axiosClient.get<never, ApiResponse<{ items: Message[] }>>(
      `/conversations/${conversationId}/pinned-messages`,
    );
  },
  togglePinMessage: async (messageId: string) => {
    return axiosClient.patch<never, ApiResponse<{ message: Message }>>(
      `/messages/${messageId}/pin`,
    );
  },
  searchMessages: async (conversationId: string, q: string) => {
    return axiosClient.get<never, ApiResponse<{ items: Message[] }>>(`/search/messages`, {
      params: { conversationId, q },
    });
  },
};
