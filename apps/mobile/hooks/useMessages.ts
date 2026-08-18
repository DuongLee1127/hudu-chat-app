import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/message.service';
import { useSocketContext } from '@/providers/SocketProvider';
import type {
  ListMessagesParams,
  ListMessagesResult,
  Message,
  SendMessagePayload,
} from '@/types/message';
import type { ApiResponse } from '@/types/api';

export function useListMessages(conversationId: string, params: ListMessagesParams = {}) {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => messageService.listMessages(conversationId, params),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { connected, sendMessage } = useSocketContext();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const tempId = payload.tempId || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const meResponse = queryClient.getQueryData<{
        data: { _id: string; username: string; avatar?: string };
      }>(['auth', 'me']);

      const optimisticMessage: Message = {
        _id: tempId,
        conversationId,
        senderId: meResponse
          ? {
              _id: meResponse.data._id,
              username: meResponse.data.username,
              avatar: meResponse.data.avatar,
            }
          : { _id: '', username: '' },
        content: payload.content || '',
        type: payload.type || 'text',
        attachmentIds: [],
        replyToMessageId: null,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tempId,
        status: 'sending',
      };

      queryClient.setQueriesData<ApiResponse<ListMessagesResult>>(
        { queryKey: ['messages', conversationId], exact: false },
        (old) =>
          old
            ? { ...old, data: { ...old.data, items: [...old.data.items, optimisticMessage] } }
            : old,
      );

      if (!connected) {
        try {
          const res = await messageService.sendMessage(conversationId, { ...payload, tempId });
          return {
            ...res,
            data: {
              ...res.data,
              tempId,
            },
          } as unknown as ApiResponse<{ message: Message; tempId?: string }>;
        } catch (error) {
          markMessageFailed(queryClient, conversationId, tempId);
          throw error;
        }
      }

      const ack = await sendMessage(conversationId, { ...payload, tempId });
      if (!ack.success || !ack.data) {
        markMessageFailed(queryClient, conversationId, tempId);
        throw new Error(ack.error || 'Gửi tin nhắn thất bại!');
      }
      return {
        success: true,
        message: 'ok',
        data: { message: ack.data, tempId },
        error: null,
      } as ApiResponse<{
        message: Message;
        tempId?: string;
      }>;
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      const serverMessage = res.data.message;
      const tempId = res.data.tempId || variables.tempId;

      queryClient.setQueriesData<ApiResponse<ListMessagesResult>>(
        { queryKey: ['messages', conversationId], exact: false },
        (old) => {
          if (!old) return old;
          const withoutTemp = tempId
            ? old.data.items.filter((m) => m.tempId !== tempId)
            : old.data.items;
          if (withoutTemp.some((m) => m._id === serverMessage._id)) {
            return {
              ...old,
              data: {
                ...old.data,
                items: withoutTemp.map((m) => (m._id === serverMessage._id ? serverMessage : m)),
              },
            };
          }
          return {
            ...old,
            data: {
              ...old.data,
              items: [...withoutTemp, serverMessage],
            },
          };
        },
      );
    },
  });
}

function markMessageFailed(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  tempId: string,
) {
  queryClient.setQueriesData<ApiResponse<ListMessagesResult>>(
    { queryKey: ['messages', conversationId], exact: false },
    (old) =>
      old
        ? {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((m) =>
                m.tempId === tempId ? { ...m, status: 'failed' as const } : m,
              ),
            },
          }
        : old,
  );
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
