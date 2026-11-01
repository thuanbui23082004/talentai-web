import type { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { candidateError, CandidateRequestError } from '@/features/applications';
import { statsQuerySchema, seriesQuerySchema, overviewSchema, funnelSchema, timeseriesSchema, type StatsQuery } from '@/features/recruiter-stats/schemas';
async function session<T>(action: () => Promise<T>): Promise<T> {
  try { await ensureApiSession(); return await action(); } catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
export const getOverview = (query: StatsQuery, signal?: AbortSignal) => session(async () => {
  const result = await apiClient.GET('/recruiter/stats/overview', { params: { query: statsQuerySchema.parse(query) }, signal });
  if (result.error) throw candidateError(result.error, result.response.status);
  return overviewSchema.parse(result.data);
});
export const getFunnel = (query: StatsQuery, signal?: AbortSignal) => session(async () => {
  const result = await apiClient.GET('/recruiter/stats/funnel', { params: { query: statsQuerySchema.parse(query) }, signal });
  if (result.error) throw candidateError(result.error, result.response.status);
  return funnelSchema.parse(result.data);
});
export const getTimeseries = (query: z.input<typeof seriesQuerySchema>, signal?: AbortSignal) => session(async () => {
  const result = await apiClient.GET('/recruiter/stats/timeseries', { params: { query: seriesQuerySchema.parse(query) }, signal });
  if (result.error) throw candidateError(result.error, result.response.status);
  return timeseriesSchema.parse(result.data);
});
