export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  error: null;
}

export interface ErrorResponse {
  success: false;
  message: string;
  data: null;
  error: {
    code?: string;
    details?: unknown;
  };
}
