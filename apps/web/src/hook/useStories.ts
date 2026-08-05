import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storyService } from '@/services/story.service';

export function useStoryFeed() {
  return useQuery({
    queryKey: ['stories', 'feed'],
    queryFn: () => storyService.listFeed(),
  });
}

export function useUserStories(userId: string) {
  return useQuery({
    queryKey: ['stories', 'user', userId],
    queryFn: () => storyService.getStoriesByUser(userId),
    enabled: !!userId,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      storyService.createStory(file, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'feed'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storyService.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useStoryViewers(storyId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['stories', storyId, 'viewers'],
    queryFn: () => storyService.listViewers(storyId),
    enabled: enabled && !!storyId,
  });
}
