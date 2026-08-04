import { useQuery } from '@tanstack/react-query';
import { callService } from '@/services/call.service';

export function useActiveCall(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['calls', 'active', conversationId],
    queryFn: () => callService.getActiveCall(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: 15000,
  });
}
