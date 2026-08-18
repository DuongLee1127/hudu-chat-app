import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LoginResult } from '@/types/auth';

type AuthState = {
  user: LoginResult | null;
  accessToken: string | null;
  refreshToken: string | null;
  logout: () => void;
  setUser: (data: LoginResult | null) => void;
  setAccessToken: (token: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setUser: (data) => {
        set({ user: data, accessToken: data?.accessToken, refreshToken: data?.refreshToken });
      },
      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
