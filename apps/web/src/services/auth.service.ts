import axiosClient from '@/api/axiosClient';
import type { LoginPayload, RegisterPayload } from '@/types/auth';

export const authService = {
  login: async (payload: LoginPayload) => {
    return axiosClient.post('/auth/login', payload);
  },
  register: async (payload: RegisterPayload) => {
    return axiosClient.post('/auth/register', payload);
  },
  logout: async () => {
    return axiosClient.post('/auth/logout');
  },
  logoutAll: async () => {
    return axiosClient.post('/auth/logout-all');
  },
  refresh: async (refreshToken: string) => {
    return axiosClient.post('/auth/refresh', { refreshToken });
  },
  getMe: async () => {
    return axiosClient.get('/auth/me');
  },
};
