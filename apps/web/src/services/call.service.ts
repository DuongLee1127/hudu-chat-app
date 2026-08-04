import axiosClient from '@/api/axiosClient';
import type { CallDTO } from '@/types/call';
import type { ApiResponse } from '@/types/api';

export const callService = {
  getActiveCall: async (conversationId: string) => {
    return axiosClient.get<never, ApiResponse<{ call: CallDTO | null }>>(
      `/conversations/${conversationId}/active-call`,
    );
  },
};
