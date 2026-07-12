import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendService } from '@/services/friend.service';
import type { GetFriendsParams } from '@/types/user';

const invalidateFriendQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['friends'] });
  queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
};

export function useFriends(params: GetFriendsParams) {
  return useQuery({
    queryKey: ['friends', params],
    queryFn: () => friendService.getFriends(params),
  });
}

export function useIncomingFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests', 'incoming'],
    queryFn: () => friendService.getIncomingRequests(),
  });
}

export function useOutgoingFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests', 'outgoing'],
    queryFn: () => friendService.getOutgoingRequests(),
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idUser: string) => friendService.sendFriendRequest(idUser),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idUser: string) => friendService.cancelFriendRequest(idUser),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idUser: string) => friendService.acceptFriendRequest(idUser),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idUser: string) => friendService.unfriend(idUser),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}
