import { z } from 'zod';
import { apiClient } from './client';
import { ApiError } from './errors';

export async function ensureApiSession() {
  const result = await apiClient.GET('/auth/csrf');
  if (result.error) throw new ApiError('SESSION_REQUEST_FAILED', result.response.status, result.error);
  return z.object({ csrfToken: z.string() }).parse(result.data).csrfToken;
}
