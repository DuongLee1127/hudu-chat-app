import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/message.service';
import type { ListMessagesParams, SendMessagePayload } from '@/types/message';

export function useListMessages(conversationId: string, params: ListMessagesParams = {}) {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => messageService.listMessages(conversationId, params),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      messageService.sendMessage(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      messageService.editMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => messageService.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lastReadMessageId: string) =>
      messageService.markAsRead(conversationId, lastReadMessageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnreadCount(conversationId: string) {
  return useQuery({
    queryKey: ['unread-count', conversationId],
    queryFn: () => messageService.getUnreadCount(conversationId),
    enabled: !!conversationId,
  });
}
