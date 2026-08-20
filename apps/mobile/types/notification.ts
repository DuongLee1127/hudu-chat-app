export type NotificationType = 'message' | 'mention' | 'system' | 'friend_request';

export interface NotificationItem {
  _id: string;
  userId: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResult {
  items: NotificationItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unreadCount: number;
  };
}
