import axiosClient from '@/api/axiosClient';
import type {
  ReportItem,
  ListReportsParams,
  UpdateReportPayload,
  AdminUser,
  ListAdminUsersParams,
  UpdateUserStatusPayload,
  AdminMetrics,
  AdminMetricsParams,
} from '@/types/admin';
import type { ApiResponse, PagedResult } from '@/types/api';

export const adminService = {
  listReports: async (params: ListReportsParams) => {
    return axiosClient.get<never, ApiResponse<PagedResult<ReportItem>>>('/admin/reports', {
      params,
    });
  },
  updateReport: async (id: string, payload: UpdateReportPayload) => {
    return axiosClient.patch<never, ApiResponse<{ report: ReportItem }>>(
      `/admin/reports/${id}`,
      payload,
    );
  },
  listUsers: async (params: ListAdminUsersParams) => {
    return axiosClient.get<never, ApiResponse<PagedResult<AdminUser>>>('/admin/users', {
      params,
    });
  },
  updateUserStatus: async (id: string, payload: UpdateUserStatusPayload) => {
    return axiosClient.patch<never, ApiResponse<{ user: AdminUser }>>(
      `/admin/users/${id}/status`,
      payload,
    );
  },
  getMetrics: async (params: AdminMetricsParams) => {
    return axiosClient.get<never, ApiResponse<AdminMetrics>>('/admin/metrics', { params });
  },
};
