import axiosClient from '@/api/axiosClient';
import type {
  Conversation,
  ConversationListItem,
  ConversationMember,
  ConversationDetailResult,
  CreateGroupPayload,
  UpdateConversationPayload,
  ListConversationsParams,
  InvitePreview,
} from '@/types/conversation';
import type { ApiResponse, PagedResult } from '@/types/api';

export const conversationService = {
  createDirectConversation: async (targetUserId: string) => {
    return axiosClient.post<never, ApiResponse<ConversationDetailResult>>('/conversations/direct', {
      targetUserId,
    });
  },
  createGroupConversation: async (payload: CreateGroupPayload) => {
    return axiosClient.post<never, ApiResponse<ConversationDetailResult>>(
      '/conversations/group',
      payload,
    );
  },
  listMyConversations: async (params: ListConversationsParams) => {
    return axiosClient.get<never, ApiResponse<PagedResult<ConversationListItem>>>(
      '/conversations',
      {
        params,
      },
    );
  },
  getConversationDetail: async (id: string) => {
    return axiosClient.get<never, ApiResponse<ConversationDetailResult>>(`/conversations/${id}`);
  },
  updateConversation: async (id: string, payload: UpdateConversationPayload) => {
    return axiosClient.patch<never, ApiResponse<Conversation>>(`/conversations/${id}`, payload);
  },
  addMembers: async (id: string, userIds: string[]) => {
    return axiosClient.post<never, ApiResponse<{ members: ConversationMember[] }>>(
      `/conversations/${id}/members`,
      { userIds },
    );
  },
  removeMember: async (id: string, userId: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(
      `/conversations/${id}/members/${userId}`,
    );
  },
  leaveConversation: async (id: string) => {
    return axiosClient.post<never, ApiResponse<{ success: boolean }>>(`/conversations/${id}/leave`);
  },
  muteConversation: async (id: string, mutedUntil: string | null) => {
    return axiosClient.patch<never, ApiResponse<{ memberSetting: ConversationMember }>>(
      `/conversations/${id}/mute`,
      { mutedUntil },
    );
  },
  archiveConversation: async (id: string, isArchived: boolean) => {
    return axiosClient.patch<never, ApiResponse<{ memberSetting: ConversationMember }>>(
      `/conversations/${id}/archive`,
      { isArchived },
    );
  },
  generateInviteCode: async (id: string) => {
    return axiosClient.post<never, ApiResponse<Conversation>>(`/conversations/${id}/invite-code`);
  },
  getConversationByInviteCode: async (code: string) => {
    return axiosClient.get<never, ApiResponse<InvitePreview>>(`/conversations/invite/${code}`);
  },
  joinByInviteCode: async (code: string) => {
    return axiosClient.post<never, ApiResponse<ConversationDetailResult>>(
      `/conversations/join/${code}`,
    );
  },
};
