import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { apiClient, ApiError } from '@/lib/api';
import { adminWorkspaceHeaders } from '@/lib/api/workspace';
import { loginSchema, sessionSchema, overviewSchema, seriesSchema, logsSchema, periodSchema, type Period, type Metric } from '@/features/admin/schemas';

function failure(body: components['schemas']['ApiError'], status: number) { return new ApiError('ADMIN_REQUEST_FAILED', status, body.error.code); }
export async function loginAdmin(input: z.infer<typeof loginSchema>) {
  const result = await apiClient.POST('/auth/login', { body: loginSchema.parse(input), headers: adminWorkspaceHeaders });
  if (result.error) throw failure(result.error, result.response.status);
  const session = sessionSchema.parse(result.data);
  if (session.user.role !== 'admin') { await logoutAdmin(); throw new ApiError('ADMIN_REQUEST_FAILED', 403, 'FORBIDDEN'); }
}
export async function logoutAdmin() {
  const session = await apiClient.GET('/auth/csrf', { headers: adminWorkspaceHeaders });
  if (session.error) throw failure(session.error, session.response.status);
  const csrf = z.object({ csrfToken: z.string() }).parse(session.data).csrfToken;
  const result = await apiClient.POST('/auth/logout', { headers: { ...adminWorkspaceHeaders, 'X-CSRF-Token': csrf } });
  if (result.error) throw failure(result.error, result.response.status);
}
export async function getAdminOverview(query: Period, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/stats/overview', { params: { query: periodSchema.parse(query) }, signal });
  if (result.error) throw failure(result.error, result.response.status);
  return overviewSchema.parse(result.data);
}
export async function getAdminSeries(query: Period, metric: Metric, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/stats/timeseries', { params: { query: { ...periodSchema.parse(query), metric, interval: 'day' } }, signal });
  if (result.error) throw failure(result.error, result.response.status);
  return seriesSchema.parse(result.data);
}
export async function getAdminLogs(query: Period, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/activity-logs', { params: { query: { from: query.from && `${query.from}T00:00:00+07:00`, to: query.to && `${query.to}T23:59:59+07:00`, page: 1, pageSize: 5 } }, signal });
  if (result.error) throw failure(result.error, result.response.status);
  // This widget shows administrative actions only, not all user activity.
  const parsed = logsSchema.parse(result.data);
  return { items: parsed.items.filter(item => item.actorRole === 'admin') };
}
