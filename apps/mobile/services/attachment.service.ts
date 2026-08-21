import axiosClient from '@/api/axiosClient';
import type { MessageAttachment, ListAttachmentsParams, ListAttachmentsResult } from '@/types/message';
import type { ApiResponse } from '@/types/api';

export const attachmentService = {
  listByConversation: async (conversationId: string, params: ListAttachmentsParams) => {
    return axiosClient.get<never, ApiResponse<ListAttachmentsResult>>(
      `/conversations/${conversationId}/attachments`,
      { params },
    );
  },
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return axiosClient.post<never, ApiResponse<{ attachments: MessageAttachment[] }>>(
      '/uploads',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  getAttachment: async (id: string) => {
    return axiosClient.get<never, ApiResponse<{ attachment: MessageAttachment }>>(
      `/attachments/${id}`,
    );
  },
  deleteAttachment: async (id: string) => {
    return axiosClient.delete<never, ApiResponse<{ success: boolean }>>(`/attachments/${id}`);
  },
};
