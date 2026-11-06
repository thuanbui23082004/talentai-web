import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { candidateError, CandidateRequestError } from '@/features/applications/errors';
import { recruiterApplicationPageSchema, recruiterApplicationQuerySchema, type RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
import type { operations } from '@/lib/api/generated/schema';
import { toApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/generated/schema';
import { jobApplicantStatusUpdateSchema } from '@/lib/api/job-applicant-schemas';

export async function listJobPipeline(jobId: string, signal?: AbortSignal) {
  const first = await listJobApplicants(jobId, { page: 1, pageSize: 100 }, signal);
  const items = [...first.items];
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await listJobApplicants(jobId, { page, pageSize: 100 }, signal);
    items.push(...next.items);
  }
  return [...new Map(items.map(item => [item.id, item])).values()];
}
export async function updateJobApplicantStatus({ id, values }: { id: string; values: components['schemas']['JobApplicantStatusUpdate'] }) {
  await ensureApiSession();
  const result = await apiClient.PATCH('/recruiter/job-applications/{applicationId}/status', { params: { path: { applicationId: z.uuid().parse(id) } }, body: jobApplicantStatusUpdateSchema.parse(values) });
  if (!result.data || result.error) throw toApiError(result.response.status, result.error);
  return result.data;
}

export type JobApplicantFilters = NonNullable<operations['listJobApplications']['parameters']['query']>;
export async function listJobApplicants(jobId: string, query: JobApplicantFilters, signal?: AbortSignal) {
  await ensureApiSession();
  const result = await apiClient.GET('/recruiter/jobs/{jobId}/applications', { params: { path: { jobId }, query }, signal });
  if (result.error || !result.data) throw toApiError(result.response.status, result.error);
  return result.data;
}
export async function getJobApplicant(id: string, signal?: AbortSignal) {
  await ensureApiSession();
  const result = await apiClient.GET('/recruiter/job-applications/{applicationId}', { params: { path: { applicationId: z.uuid().parse(id) } }, signal });
  if (!result.data || result.error) throw toApiError(result.response.status, result.error);
  return result.data;
}
export async function getJobApplicantResume(id: string, signal?: AbortSignal) {
  await ensureApiSession();
  const result = await apiClient.GET('/recruiter/job-applications/{applicationId}/resume', { params: { path: { applicationId: z.uuid().parse(id) } }, signal });
  if (!result.data || result.error) throw toApiError(result.response.status, result.error);
  return result.data;
}
export async function getJobApplicantCv(id: string, signal?: AbortSignal) {
  await ensureApiSession();
  const result = await apiClient.GET('/recruiter/job-applications/{applicationId}/cv', { params: { path: { applicationId: z.uuid().parse(id) } }, signal, parseAs: 'blob' });
  if (!result.data || result.error) throw toApiError(result.response.status, result.error);
  if (await result.data.slice(0, 5).text() !== '%PDF-') throw new CandidateRequestError('cvInvalid');
  return result.data;
}

export async function listRecruiterApplications(query: RecruiterApplicationQuery) {
  const validated = recruiterApplicationQuerySchema.parse(query);
  try {
    await ensureApiSession();
    const result = await apiClient.GET('/recruiter/applications', { params: { query: validated } });
    if (result.error) throw candidateError(result.error, result.response.status);
    return recruiterApplicationPageSchema.parse(result.data);
  } catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
export async function getApplicantCv(applicationId: string) {
  const id = z.uuid().parse(applicationId);
  try {
    await ensureApiSession();
    const result = await apiClient.GET('/recruiter/applications/{applicationId}/cv', { params: { path: { applicationId: id }, query: { disposition: 'inline' } }, parseAs: 'blob' });
    if (result.error) throw candidateError(result.error, result.response.status);
    const blob = z.instanceof(Blob).parse(result.data);
    if (blob.type.split(';')[0] !== 'application/pdf' && blob.type.split(';')[0] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') throw new CandidateRequestError('cvInvalid');
    if (blob.size === 0) throw new CandidateRequestError('cvUnavailable');
    if (blob.type.split(';')[0] === 'application/pdf' && await blob.slice(0, 5).text() !== '%PDF-') throw new CandidateRequestError('cvInvalid');
    return blob;
  } catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
