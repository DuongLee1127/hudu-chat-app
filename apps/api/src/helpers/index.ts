import { Response } from 'express';
import type { SuccessResponse, ErrorResponse } from '@/types';

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', statusCode = 200) => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = 'Internal server error',
  statusCode = 500,
  error?: {
    code?: string;
    details?: unknown;
  },
) => {
  const response: ErrorResponse = {
    success: false,
    message,
    data: null,
    error: error || {
      code: 'INTERNAL_SERVER_ERROR',
    },
  };

  return res.status(statusCode).json(response);
};
