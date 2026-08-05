import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '@/services/conversation.service';
import type {
  CreateGroupPayload,
  UpdateConversationPayload,
  ListConversationsParams,
} from '@/types/conversation';

export function useListConversations(params: ListConversationsParams) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => conversationService.listMyConversations(params),
  });
}

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => conversationService.getConversationDetail(id),
    enabled: !!id,
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      conversationService.createDirectConversation(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) =>
      conversationService.createGroupConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateConversationPayload) =>
      conversationService.updateConversation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
}

export function useAddMembers(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) => conversationService.addMembers(id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
}

export function useRemoveMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => conversationService.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationService.leaveConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMuteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mutedUntil }: { id: string; mutedUntil: string | null }) =>
      conversationService.muteConversation(id, mutedUntil),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      conversationService.archiveConversation(id, isArchived),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
}

export function useGenerateInviteCode(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => conversationService.generateInviteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
}

export function useInvitePreview(code: string) {
  return useQuery({
    queryKey: ['invite-preview', code],
    queryFn: () => conversationService.getConversationByInviteCode(code),
    enabled: !!code,
    retry: false,
  });
}

export function useJoinByInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => conversationService.joinByInviteCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
