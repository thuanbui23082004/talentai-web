import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { interviewSchema, interviewResultInputSchema } from '@/lib/api/candidate-detail-schemas';
import { candidateError, CandidateRequestError } from '@/features/applications/errors';
async function session<T>(action: (csrf: string) => Promise<T>): Promise<T> {
  try { return await action(await ensureApiSession()); }
  catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
export function listInterviewResults(applicationId: string) {
  return session(async () => {
    const response = await apiClient.GET('/recruiter/applications/{applicationId}/interviews', { params: { path: { applicationId: z.uuid().parse(applicationId) } } });
    if (response.error) throw candidateError(response.error, response.response.status);
    return z.object({ items: z.array(interviewSchema) }).parse(response.data);
  });
}
export function saveInterviewResult(id: string, input: z.infer<typeof interviewResultInputSchema>) {
  return session(async csrf => {
    const response = await apiClient.PUT('/recruiter/interviews/{interviewId}/result', { params: { path: { interviewId: z.uuid().parse(id) } }, headers: { 'X-CSRF-Token': csrf }, body: interviewResultInputSchema.parse(input) });
    if (response.error) throw candidateError(response.error, response.response.status);
    return interviewSchema.parse(response.data);
  });
}
