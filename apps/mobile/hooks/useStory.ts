import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storyService } from '@/services/story.service';

export function useStoryFeed() {
  return useQuery({
    queryKey: ['story-feed'],
    queryFn: () => storyService.listFeed(),
    staleTime: 1000 * 60, // 1 minute cache
  });
}

export function useUserStories(userId: string) {
  return useQuery({
    queryKey: ['user-stories', userId],
    queryFn: () => storyService.getStoriesByUser(userId),
    enabled: Boolean(userId),
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      caption,
    }: {
      file: { uri: string; type: string; name: string };
      caption?: string;
    }) => storyService.createStory(file, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-feed'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storyService.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-feed'] });
    },
  });
}
