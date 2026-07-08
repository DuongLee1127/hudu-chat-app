export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: { code?: string; details?: unknown } | null;
}

export interface PagedMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PagedResult<T> {
  items: T[];
  meta: PagedMeta;
}
