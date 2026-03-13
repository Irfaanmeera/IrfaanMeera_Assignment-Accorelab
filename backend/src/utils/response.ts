import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode = 200): void {
  if (statusCode === 204) {
    res.status(204).send();
    return;
  }
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    statusCode,
  };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode = 500, error?: string): void {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    statusCode,
  };
  res.status(statusCode).json(response);
}
