import axiosClient from '@/api/axiosClient';
import type {
  UpdateProfilePayload,
  ChangePasswordPayload,
  SearchUsersParams,
  ListBlockUserParams,
  User,
} from '@/types/user';
import type { ApiResponse, PagedResult } from '@/types/api';

export const userService = {
  updateProfile: async (payload: UpdateProfilePayload) => {
    return axiosClient.put<never, ApiResponse<User>>('/users/me', payload);
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    return axiosClient.put<never, ApiResponse<{ success: boolean }>>(
      '/auth/me/change-password',
      payload,
    );
  },
  viewProfilePublic: async (idUser: string) => {
    return axiosClient.get<never, ApiResponse<{ publicUser: User }>>(`/users/${idUser}`);
  },
  searchUsers: async (params: SearchUsersParams) => {
    return axiosClient.get<never, ApiResponse<PagedResult<User>>>('/users/search', { params });
  },
  getListBlockUser: async (params: ListBlockUserParams) => {
    return axiosClient.get<never, ApiResponse<PagedResult<User>>>('/users/me/blocks', { params });
  },
  blockUser: async (idUser: string) => {
    return axiosClient.post<never, ApiResponse<{ success: boolean }>>(`/users/${idUser}/block`);
  },
  unblockUser: async (idUser: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(`/users/${idUser}/block`);
  },
};
