import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import type {
  UpdateProfilePayload,
  ChangePasswordPayload,
  SearchUsersParams,
  ListBlockUserParams,
} from '@/types/user';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: () => {
      // Invalidate current user query since profile updated
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userService.changePassword(payload),
  });
}

export function useViewProfilePublic(idUser: string) {
  return useQuery({
    queryKey: ['users', idUser],
    queryFn: () => userService.viewProfilePublic(idUser),
    enabled: !!idUser,
  });
}

export function useSearchUsers(params: SearchUsersParams) {
  return useQuery({
    queryKey: ['users', 'search', params],
    queryFn: () => userService.searchUsers(params),
  });
}

export function useGetListBlockUser(params: ListBlockUserParams) {
  return useQuery({
    queryKey: ['users', 'blocked', params],
    queryFn: () => userService.getListBlockUser(params),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idUser: string) => userService.blockUser(idUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'blocked'] });
    },
  });
}

export function useUnBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idUser: string) => userService.unblockUser(idUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'blocked'] });
    },
  });
}
