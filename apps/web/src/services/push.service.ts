import axiosClient from '@/api/axiosClient';
import type { ApiResponse } from '@/types/api';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const pushService = {
  subscribe: async (payload: PushSubscriptionPayload) => {
    return axiosClient.post<never, ApiResponse<{ success: boolean }>>('/push/subscribe', payload);
  },
  unsubscribe: async (endpoint: string) => {
    return axiosClient.post<never, ApiResponse<{ success: boolean }>>('/push/unsubscribe', {
      endpoint,
    });
  },
};
