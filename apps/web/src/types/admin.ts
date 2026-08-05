import type { User } from './user';

export interface ReportItem {
  _id: string;
  reporterId: { _id: string; username: string; avatar?: string };
  targetType: 'message' | 'user' | 'conversation';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  note?: string;
  resolvedBy?: { _id: string; username: string; avatar?: string } | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListReportsParams {
  status?: ReportItem['status'];
  page?: number;
  pageSize?: number;
}

export interface UpdateReportPayload {
  status?: ReportItem['status'];
  note?: string;
}

export interface ListAdminUsersParams {
  q?: string;
  status?: 'active' | 'locked';
  page?: number;
  pageSize?: number;
}

export interface UpdateUserStatusPayload {
  status: 'active' | 'locked';
  reason?: string;
}

export interface AdminMetrics {
  users: { total: number; new: number };
  messages: { total: number; new: number };
  conversations: { total: number; new: number };
}

export interface AdminMetricsParams {
  from?: string;
  to?: string;
}

export type AdminUser = User;
