import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import type {
  ListReportsParams,
  UpdateReportPayload,
  ListAdminUsersParams,
  UpdateUserStatusPayload,
  AdminMetricsParams,
} from '@/types/admin';

export function useAdminMetrics(params: AdminMetricsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'metrics', params],
    queryFn: () => adminService.getMetrics(params),
  });
}

export function useAdminUsers(params: ListAdminUsersParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.listUsers(params),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusPayload }) =>
      adminService.updateUserStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminReports(params: ListReportsParams) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => adminService.listReports(params),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReportPayload }) =>
      adminService.updateReport(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}
