import { apiClient, ApiError } from '@/lib/api';
import { contentHeaders } from '@/features/admin/services/content';
import { systemLogPageSchema, anomalyPageSchema, anomalySchema, anomalyReviewSchema, type AnomalyReview } from '@/features/admin/schemas/monitoring';
export async function getSystemLogs(signal?: AbortSignal) {
  const rows = []; let page = 1, pages = 1;
  do { const result = await apiClient.GET('/admin/system-logs', { params: { query: { page, pageSize: 100 } }, signal }); if (result.error) throw new ApiError('SYSTEM_LOGS_FAILED', result.response.status, result.error); const data = systemLogPageSchema.parse(result.data); rows.push(...data.items); pages = data.meta.totalPages; page++; } while (page <= pages);
  return rows;
}
export async function getAnomalies(signal?: AbortSignal) {
  const rows = []; let page = 1, pages = 1;
  do { const result = await apiClient.GET('/admin/anomalies', { params: { query: { page, pageSize: 100 } }, signal }); if (result.error) throw new ApiError('ANOMALIES_FAILED', result.response.status, result.error); const data = anomalyPageSchema.parse(result.data); rows.push(...data.items); pages = data.meta.totalPages; page++; } while (page <= pages);
  return rows;
}
export async function reviewAnomaly(anomalyId: string, input: AnomalyReview) {
  const result = await apiClient.PATCH('/admin/anomalies/{anomalyId}', { params: { path: { anomalyId } }, body: anomalyReviewSchema.parse(input), headers: await contentHeaders() });
  if (result.error) throw new ApiError('ANOMALY_UPDATE_FAILED', result.response.status, result.error);
  return anomalySchema.parse(result.data);
}
