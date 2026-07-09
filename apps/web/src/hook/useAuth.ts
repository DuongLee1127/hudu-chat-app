import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { LoginPayload, RegisterPayload } from '@/types/auth';

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useRefresh() {
  return useMutation({
    mutationFn: (refreshToken: string) => authService.refresh(refreshToken),
  });
}

export function useGetMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getMe(),
  });
}
