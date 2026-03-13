import axios from 'axios';

export interface ApiError {
  message: string;
  status?: number;
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const message =
      (err.response?.data as { message?: string } | undefined)?.message ||
      err.message ||
      'Request failed';
    return { message, status };
  }

  if (err instanceof Error) return { message: err.message };
  return { message: 'Unknown error' };
}

