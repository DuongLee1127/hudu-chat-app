import axiosClient from '@/api/axiosClient';
import type { Story, StoryFeedGroup, StoryViewer } from '@/types/story';
import type { ApiResponse } from '@/types/api';

export const storyService = {
  createStory: async (file: { uri: string; type: string; name: string }, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file as any);
    if (caption) formData.append('caption', caption);

    return axiosClient.post<never, ApiResponse<{ story: Story }>>('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listFeed: async () => {
    return axiosClient.get<never, ApiResponse<{ feed: StoryFeedGroup[] }>>('/stories/feed');
  },
  getStoriesByUser: async (userId: string) => {
    return axiosClient.get<never, ApiResponse<{ stories: Story[] }>>(`/stories/user/${userId}`);
  },
  deleteStory: async (id: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(`/stories/${id}`);
  },
  listViewers: async (id: string) => {
    return axiosClient.get<never, ApiResponse<{ viewers: StoryViewer[] }>>(
      `/stories/${id}/viewers`,
    );
  },
};
