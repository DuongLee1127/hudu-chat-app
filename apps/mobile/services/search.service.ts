import axiosClient from '@/api/axiosClient';
import type { ApiResponse } from '@/types/api';

export interface GlobalSearchUser {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  status?: string;
  conversationId?: string | null;
}

export interface GlobalSearchGroup {
  _id: string;
  name: string;
  avatar?: string;
  type: 'group';
  lastMessageAt?: string;
}

export interface GlobalSearchMessage {
  _id: string;
  content: string;
  createdAt: string;
  senderId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  conversationId: {
    _id: string;
    name?: string;
    type: 'private' | 'group';
    avatar?: string;
  };
}

export interface GlobalSearchResult {
  users: GlobalSearchUser[];
  conversations: GlobalSearchGroup[];
  messages: GlobalSearchMessage[];
}

export const searchService = {
  searchGlobal: async (q: string) => {
    return axiosClient.get<never, ApiResponse<GlobalSearchResult>>('/search/global', {
      params: { q },
    });
  },
};
