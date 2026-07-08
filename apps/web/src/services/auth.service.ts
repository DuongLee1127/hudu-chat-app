import axiosClient from '@/api/axiosClient';
import type { LoginPayload, RegisterPayload } from '@/types/auth';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  id: string;
  email: string;
  username: string;
}

export interface RegisterResult {
  id: string;
  email: string;
  username: string;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    return axiosClient.post<never, ApiResponse<LoginResult>>('/auth/login', payload);
  },
  register: async (payload: RegisterPayload) => {
    return axiosClient.post<never, ApiResponse<RegisterResult>>('/auth/register', payload);
  },
  logout: async () => {
    return axiosClient.post<never, ApiResponse<null>>('/auth/logout');
  },
  logoutAll: async () => {
    return axiosClient.post<never, ApiResponse<null>>('/auth/logout-all');
  },
  refresh: async (refreshToken: string) => {
    return axiosClient.post<never, ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken,
    });
  },
  getMe: async () => {
    return axiosClient.get<never, ApiResponse<User>>('/auth/me');
  },
};
