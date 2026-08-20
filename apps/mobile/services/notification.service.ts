import axiosClient from '@/api/axiosClient';
import type {
  ListNotificationsParams,
  ListNotificationsResult,
  NotificationItem,
} from '@/types/notification';
import type { ApiResponse } from '@/types/api';

export const notificationService = {
  listNotifications: async (params: ListNotificationsParams) => {
    return axiosClient.get<never, ApiResponse<ListNotificationsResult>>('/notifications', {
      params,
    });
  },
  markAsRead: async (id: string) => {
    return axiosClient.patch<never, ApiResponse<{ notification: NotificationItem }>>(
      `/notifications/${id}/read`,
    );
  },
  markAllAsRead: async () => {
    return axiosClient.patch<never, ApiResponse<{ success: boolean }>>('/notifications/read-all');
  },
};
