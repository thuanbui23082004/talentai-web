import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api';
import { periodSchema, type Period } from '@/features/admin/schemas';
import { applicationStatsSchema, recruitmentStatsSchema, systemMetricsSchema, statisticsSeriesQuerySchema, type StatisticsMetric, type StatisticsInterval } from '@/features/admin/schemas/statistics';
const series = z.object({ metric: z.string(), interval: z.enum(['day', 'week', 'month']), points: z.array(z.object({ date: z.iso.date(), value: z.number().nonnegative() })) });
export async function getApplicationStats(period: Period, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/stats/applications', { params: { query: periodSchema.parse(period) }, signal });
  if (result.error) throw new ApiError('ADMIN_STATISTICS_FAILED', result.response.status, result.error.error.code);
  return applicationStatsSchema.parse(result.data);
}
export async function getRecruitmentStats(period: Period, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/stats/recruitment', { params: { query: periodSchema.parse(period) }, signal });
  if (result.error) throw new ApiError('ADMIN_STATISTICS_FAILED', result.response.status, result.error.error.code);
  return recruitmentStatsSchema.parse(result.data);
}
export async function getSystemMetrics(signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/stats/system-metrics', { signal });
  if (result.error) throw new ApiError('ADMIN_STATISTICS_FAILED', result.response.status, result.error.error.code);
  return systemMetricsSchema.parse(result.data);
}
export async function getStatisticsSeries(period: Period, metric: StatisticsMetric, interval: StatisticsInterval, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/stats/timeseries', { params: { query: { ...periodSchema.parse(period), ...statisticsSeriesQuerySchema.parse({ metric, interval }) } }, signal });
  if (result.error) throw new ApiError('ADMIN_STATISTICS_FAILED', result.response.status, result.error.error.code);
  return series.parse(result.data);
}
