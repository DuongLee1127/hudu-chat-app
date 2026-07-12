import axiosClient from '@/api/axiosClient';
import type { GetFriendsParams, FriendRequestItem, User } from '@/types/user';
import type { ApiResponse, PagedResult } from '@/types/api';

export const friendService = {
  getFriends: async (params: GetFriendsParams) => {
    return axiosClient.get<never, ApiResponse<PagedResult<User>>>('/friends/me', { params });
  },
  getIncomingRequests: async () => {
    return axiosClient.get<never, ApiResponse<FriendRequestItem[]>>(
      '/friends/me/requests/incoming',
    );
  },
  getOutgoingRequests: async () => {
    return axiosClient.get<never, ApiResponse<FriendRequestItem[]>>(
      '/friends/me/requests/outgoing',
    );
  },
  sendFriendRequest: async (idUser: string) => {
    return axiosClient.post<never, ApiResponse<{ success: boolean; status: string }>>(
      `/friends/${idUser}/request`,
    );
  },
  cancelFriendRequest: async (idUser: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(
      `/friends/${idUser}/request`,
    );
  },
  acceptFriendRequest: async (idUser: string) => {
    return axiosClient.post<never, ApiResponse<{ success: boolean }>>(`/friends/${idUser}/accept`);
  },
  unfriend: async (idUser: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(`/friends/${idUser}`);
  },
};
