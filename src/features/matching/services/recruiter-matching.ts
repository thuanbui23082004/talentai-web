import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { analysisTaskSchema, matchingResultSchema, recommendedCandidatesSchema } from '@/lib/api/analysis-schemas';
import { recruiterApplicationPageSchema, recruiterApplicationQuerySchema, type RecruiterApplicationQuery } from '@/lib/api/application-schemas';
import { screeningError, ScreeningError } from '@/features/matching/errors';
async function session<T>(action: (token: string) => Promise<T>): Promise<T> {
  try { return await action(await ensureApiSession()); } catch (error) { throw error instanceof ScreeningError ? error : screeningError(error); }
}
export function startRecruiterScreening(jobId: string) { return session(async token => {
  const result = await apiClient.POST('/recruiter/jobs/{jobId}/screening', { params: { path: { jobId: z.uuid().parse(jobId) } }, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw screeningError(result.error, result.response.status);
  return analysisTaskSchema.parse(result.data);
}); }
export function startRecruiterMatching(applicationId: string) { return session(async token => {
  const result = await apiClient.POST('/recruiter/applications/{applicationId}/matching', { params: { path: { applicationId: z.uuid().parse(applicationId) } }, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw screeningError(result.error, result.response.status);
  return analysisTaskSchema.parse(result.data);
}); }
export function getRecruiterMatching(applicationId: string) { return session(async () => {
  const result = await apiClient.GET('/recruiter/applications/{applicationId}/matching', { params: { path: { applicationId: z.uuid().parse(applicationId) } } });
  if (result.response.status === 404) return null;
  if (result.error) throw screeningError(result.error, result.response.status);
  return matchingResultSchema.parse(result.data);
}); }
export function getAnalysisTask(taskId: string, signal?: AbortSignal) { return session(async () => {
  const result = await apiClient.GET('/analysis-tasks/{taskId}', { params: { path: { taskId: z.uuid().parse(taskId) } }, signal });
  if (result.error) throw screeningError(result.error, result.response.status);
  return analysisTaskSchema.parse(result.data);
}); }
export function listRankedApplications(jobId: string, query: RecruiterApplicationQuery) { return session(async () => {
  const values = recruiterApplicationQuerySchema.parse(query);
  const { jobId: _jobId, ...filters } = values; void _jobId;
  const result = await apiClient.GET('/recruiter/jobs/{jobId}/applications', { params: { path: { jobId: z.uuid().parse(jobId) }, query: filters } });
  if (result.error) throw screeningError(result.error, result.response.status);
  return recruiterApplicationPageSchema.parse(result.data);
}); }
export function getRecommendedCandidates(jobId: string) { return session(async () => {
  const result = await apiClient.GET('/recruiter/jobs/{jobId}/recommended-candidates', { params: { path: { jobId: z.uuid().parse(jobId) }, query: { limit: 10 } } });
  if (result.error) throw screeningError(result.error, result.response.status);
  return recommendedCandidatesSchema.parse(result.data);
}); }
