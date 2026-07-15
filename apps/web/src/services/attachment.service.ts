import axiosClient from '@/api/axiosClient';
import type { MessageAttachment } from '@/types/message';
import type { ApiResponse } from '@/types/api';

export const attachmentService = {
  uploadFiles: async (files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return axiosClient.post<never, ApiResponse<{ attachments: MessageAttachment[] }>>(
      '/uploads',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
        },
      },
    );
  },
  listConversationAttachments: async (conversationId: string, type?: 'image') => {
    return axiosClient.get<never, ApiResponse<{ attachments: MessageAttachment[] }>>(
      `/conversations/${conversationId}/attachments`,
      { params: type ? { type } : undefined },
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
