import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { candidateError, CandidateRequestError } from '@/features/applications/errors';
import { managedInterviewSchema, interviewPageSchema, interviewQuerySchema, interviewUpdateSchema, cancelInterviewSchema, type InterviewQuery } from '@/features/interviews/schemas';
async function session<T>(action: (csrf: string) => Promise<T>): Promise<T> {
  try { return await action(await ensureApiSession()); }
  catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
export function listInterviews(query: InterviewQuery, signal?: AbortSignal) {
  return session(async () => {
    const response = await apiClient.GET('/recruiter/interviews', { params: { query: interviewQuerySchema.parse(query) }, signal });
    if (response.error) throw candidateError(response.error, response.response.status);
    return interviewPageSchema.parse(response.data);
  });
}
export async function listCalendarInterviews(query: InterviewQuery, signal?: AbortSignal) {
  const first = await listInterviews({ ...query, page: 1, pageSize: 100 }, signal);
  const items = [...first.items];
  for (let page = 2; page <= first.meta.totalPages; page++) items.push(...(await listInterviews({ ...query, page, pageSize: 100 }, signal)).items);
  return items;
}
export function getInterview(id: string) {
  return session(async () => {
    const response = await apiClient.GET('/recruiter/interviews/{interviewId}', { params: { path: { interviewId: z.uuid().parse(id) } } });
    if (response.error) throw candidateError(response.error, response.response.status);
    return managedInterviewSchema.parse(response.data);
  });
}
export function updateInterview(id: string, input: z.infer<typeof interviewUpdateSchema>) {
  return session(async csrf => {
    const response = await apiClient.PATCH('/recruiter/interviews/{interviewId}', { params: { path: { interviewId: z.uuid().parse(id) } }, body: interviewUpdateSchema.parse(input), headers: { 'X-CSRF-Token': csrf } });
    if (response.error) throw candidateError(response.error, response.response.status);
    return managedInterviewSchema.parse(response.data);
  });
}
export function resendInvitation(id: string) {
  return session(async csrf => {
    const response = await apiClient.POST('/recruiter/interviews/{interviewId}/send-invitation', { params: { path: { interviewId: z.uuid().parse(id) } }, headers: { 'X-CSRF-Token': csrf } });
    if (response.error) throw candidateError(response.error, response.response.status);
    return managedInterviewSchema.parse(response.data);
  });
}
export function cancelInterview(id: string, reason: string) {
  return session(async csrf => {
    const response = await apiClient.POST('/recruiter/interviews/{interviewId}/cancel', { params: { path: { interviewId: z.uuid().parse(id) } }, body: cancelInterviewSchema.parse({ reason }), headers: { 'X-CSRF-Token': csrf } });
    if (response.error) throw candidateError(response.error, response.response.status);
    return managedInterviewSchema.parse(response.data);
  });
}
