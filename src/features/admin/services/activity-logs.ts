import { apiClient, ApiError } from '@/lib/api';
import { activityPageSchema } from '@/features/admin/schemas/activity-logs';
export async function getAdminActivityLogs(signal?: AbortSignal) {
  const items = []; let page = 1, pages = 1;
  do {
    const result = await apiClient.GET('/admin/activity-logs', { params: { query: { role: 'admin', page, pageSize: 100 } }, signal });
    if (result.error) throw new ApiError('ADMIN_ACTIVITY_FAILED', result.response.status, result.error);
    const data = activityPageSchema.parse(result.data); items.push(...data.items); pages = data.meta.totalPages; page++;
  } while (page <= pages);
  return items.filter(item => item.actorRole === 'admin');
}
