import { useInfiniteQuery } from '@tanstack/react-query';
import { attachmentService } from '@/services/attachment.service';
import type { AttachmentMediaType } from '@/types/message';

export function useConversationAttachments(conversationId: string, type: AttachmentMediaType) {
  return useInfiniteQuery({
    queryKey: ['conversations', conversationId, 'attachments', type],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      attachmentService.listByConversation(conversationId, { type, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!conversationId,
  });
}
