import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { candidateDetailSchema, evaluationInputSchema, evaluationSchema, interviewInputSchema, interviewSchema, statusUpdateSchema } from '@/lib/api/candidate-detail-schemas';
import { candidateError, CandidateRequestError } from '@/features/applications/errors';

async function withSession<T>(action: (csrf: string) => Promise<T>): Promise<T> {
  try { return await action(await ensureApiSession()); }
  catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
export function getCandidateDetail(id: string) {
  if (!z.uuid().safeParse(id).success) return Promise.reject(new CandidateRequestError('notFound', 404));
  return withSession(async () => {
    const result = await apiClient.GET('/recruiter/applications/{applicationId}', { params: { path: { applicationId: z.uuid().parse(id) } } });
    if (result.error) throw candidateError(result.error, result.response.status);
    return candidateDetailSchema.parse(result.data);
  });
}
export function updateCandidateStatus(id: string, input: z.input<typeof statusUpdateSchema>) {
  return withSession(async csrf => {
    const result = await apiClient.PATCH('/recruiter/applications/{applicationId}/status', { params: { path: { applicationId: z.uuid().parse(id) } }, body: statusUpdateSchema.parse(input), headers: { 'X-CSRF-Token': csrf } });
    if (result.error) throw candidateError(result.error, result.response.status);
    return candidateDetailSchema.parse(result.data);
  });
}
export function saveCandidateEvaluation(id: string, input: z.input<typeof evaluationInputSchema>) {
  return withSession(async csrf => {
    const result = await apiClient.PUT('/recruiter/applications/{applicationId}/evaluation', { params: { path: { applicationId: z.uuid().parse(id) } }, body: evaluationInputSchema.parse(input), headers: { 'X-CSRF-Token': csrf } });
    if (result.error) throw candidateError(result.error, result.response.status);
    return evaluationSchema.parse(result.data);
  });
}
export function createCandidateInterview(input: z.input<typeof interviewInputSchema>, idempotencyKey: string) {
  return withSession(async csrf => {
    const result = await apiClient.POST('/recruiter/interviews', { body: interviewInputSchema.parse(input), headers: { 'X-CSRF-Token': csrf, 'Idempotency-Key': idempotencyKey } });
    if (result.error) throw candidateError(result.error, result.response.status);
    return interviewSchema.parse(result.data);
  });
}
