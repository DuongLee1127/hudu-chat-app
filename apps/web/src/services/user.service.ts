import axiosClient from '@/api/axiosClient';
import type {
  UpdateProfilePayload,
  ChangePasswordPayload,
  SearchUsersParams,
  ListBlockUserParams,
} from '@/types/user';

export const userService = {
  updateProfile: async (payload: UpdateProfilePayload) => {
    return axiosClient.put('/users/me', payload);
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    return axiosClient.put('/users/me/password', payload);
  },
  viewProfilePublic: async (idUser: string) => {
    return axiosClient.get(`/users/${idUser}`);
  },
  searchUsers: async (params: SearchUsersParams) => {
    return axiosClient.get('/users/search', { params });
  },
  getListBlockUser: async (params: ListBlockUserParams) => {
    return axiosClient.get('/users/me/blocks', { params });
  },
  blockUser: async (idUser: string) => {
    return axiosClient.post(`/users/${idUser}/block`);
  },
  unblockUser: async (idUser: string) => {
    return axiosClient.delete(`/users/${idUser}/block`);
  },
};
