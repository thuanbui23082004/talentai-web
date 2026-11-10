import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api';
import { adminWorkspaceHeaders } from '@/lib/api/workspace';
import { managedUserSchema, userPageSchema, reasonSchema } from '@/features/admin/schemas/users';
import { logsSchema } from '@/features/admin/schemas';

export async function getManagedUsers(signal?: AbortSignal) {
  // Fetch contract pages without q: search text can contain an email and must stay off URLs.
  const users = [];
  let page = 1, pages = 1;
  do {
    const result = await apiClient.GET('/admin/users', { params: { query: { page, pageSize: 100, sort: 'newest' } }, signal });
    if (result.error) throw new ApiError('ADMIN_USERS_FAILED', result.response.status, result.error);
    const data = userPageSchema.parse(result.data);
    users.push(...data.items.filter(user => user.role !== 'admin'));
    pages = data.meta.totalPages; page++;
  } while (page <= pages);
  return users;
}
export async function getManagedUser(userId: string, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/users/{userId}', { params: { path: { userId } }, signal });
  if (result.error) throw new ApiError('ADMIN_USER_FAILED', result.response.status, result.error);
  return managedUserSchema.parse(result.data);
}
export async function getUserActivity(userId: string, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/users/{userId}/activity', { params: { path: { userId }, query: { page: 1, pageSize: 100 } }, signal });
  if (result.error) throw new ApiError('ADMIN_USER_HISTORY_FAILED', result.response.status, result.error);
  return logsSchema.parse(result.data);
}
export async function changeUserAccess(userId: string, action: 'lock' | 'unlock', input: z.infer<typeof reasonSchema>) {
  const { reason } = reasonSchema.parse(input);
  const csrf = await apiClient.GET('/auth/csrf', { headers: adminWorkspaceHeaders });
  if (csrf.error) throw new ApiError('ADMIN_SESSION_FAILED', csrf.response.status, csrf.error);
  const token = z.object({ csrfToken: z.string() }).parse(csrf.data).csrfToken;
  const options = { params: { path: { userId } }, headers: { ...adminWorkspaceHeaders, 'X-CSRF-Token': token } };
  const result = action === 'lock'
    ? await apiClient.POST('/admin/users/{userId}/lock', { ...options, body: { reason } })
    : await apiClient.POST('/admin/users/{userId}/unlock', { ...options, body: { note: reason } });
  if (result.error) throw new ApiError('ADMIN_USER_UPDATE_FAILED', result.response.status, result.error);
  return managedUserSchema.parse(result.data);
}
