import axiosClient from '@/api/axiosClient';
import type { ApiResponse } from '@/types/api';

export type NotificationType = 'message' | 'friend_request' | 'system' | 'mention';

export interface AppNotification {
  _id: string;
  userId: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsResult {
  items: AppNotification[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unreadCount: number;
  };
}

export const notificationService = {
  list: async (params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) => {
    return axiosClient.get<never, ApiResponse<ListNotificationsResult>>('/notifications', {
      params,
    });
  },
  markAsRead: async (id: string) => {
    return axiosClient.patch<never, ApiResponse<{ notification: AppNotification }>>(
      `/notifications/${id}/read`,
    );
  },
  markAllAsRead: async () => {
    return axiosClient.patch<never, ApiResponse<{ success: boolean }>>('/notifications/read-all');
  },
};
