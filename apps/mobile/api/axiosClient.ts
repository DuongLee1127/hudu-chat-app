import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth.service';

const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Refresh-token queue ──────────────────────────────────────────────────────
// When multiple requests fail with 401 at the same time, we queue them and
// resolve / reject them all once a single refresh attempt finishes.
type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Response interceptor ─────────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 errors that have not already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;

    // No refresh token → force logout immediately
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Another refresh is already in progress → queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Start the refresh flow
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use authService.refresh to keep all API calls centralised
      const result = await authService.refresh(refreshToken);
      const newAccessToken = result.data.accessToken;

      console.log('newAccessToken', newAccessToken);

      // Persist the new access token
      useAuthStore.getState().setAccessToken(newAccessToken);

      // Unblock queued requests
      processQueue(null, newAccessToken);

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      // Refresh token is expired / invalid → call logout API then clear local state
      processQueue(refreshError, null);
      authService.logout().catch(() => {}); // best-effort – tokens are already invalid
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
