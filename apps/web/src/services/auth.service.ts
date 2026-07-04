import axiosClient from '@/api/axiosClient';
import type { LoginPayload, RegisterPayload } from '@/types/payload';

export const authService = {
  login: async (payload: LoginPayload) => {
    return axiosClient.post('/auth/login', payload);
  },
  register: async (payload: RegisterPayload) => {
    return axiosClient.post('/auth/register', payload);
  },
};
