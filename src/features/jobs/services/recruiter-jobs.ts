import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { catalogPageSchema, companySchema, recruiterJobPageSchema, recruiterJobSchema } from '@/lib/api/job-schemas';
import { jobRequestError } from '@/features/jobs/errors';
import type { JobInput } from '@/features/jobs/types';

async function csrf() {
  const result = await apiClient.GET('/auth/csrf');
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return z.object({ csrfToken: z.string() }).parse(result.data).csrfToken;
}
export async function getRecruiterJobOptions() {
  await csrf();
  const [industries, locations, company] = await Promise.all([
    apiClient.GET('/catalog/{catalogType}', { params: { path: { catalogType: 'industries' }, query: { pageSize: 100 } } }),
    apiClient.GET('/catalog/{catalogType}', { params: { path: { catalogType: 'locations' }, query: { pageSize: 100 } } }),
    apiClient.GET('/recruiter/company'),
  ]);
  for (const result of [industries, locations, company]) if (result.error) throw jobRequestError(result.error, result.response.status);
  return { industries: catalogPageSchema.parse(industries.data).items, locations: catalogPageSchema.parse(locations.data).items, company: companySchema.parse(company.data) };
}
export async function getRecruiterLocations() {
  const result = await apiClient.GET('/catalog/{catalogType}', { params: { path: { catalogType: 'locations' }, query: { pageSize: 100 } } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return catalogPageSchema.parse(result.data).items;
}
export async function createRecruiterJob(input: JobInput) {
  const token = await csrf();
  const result = await apiClient.POST('/recruiter/jobs', { body: input, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobSchema.parse(result.data);
}
export async function listRecruiterJobs() {
  await csrf();
  const result = await apiClient.GET('/recruiter/jobs', { params: { query: { pageSize: 100 } } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobPageSchema.parse(result.data);
}
export async function getRecruiterJob(id: string) {
  if (!z.uuid().safeParse(id).success) throw jobRequestError({ error: { code: 'NOT_FOUND' } }, 404);
  await csrf();
  const result = await apiClient.GET('/recruiter/jobs/{jobId}', { params: { path: { jobId: id } } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobSchema.parse(result.data);
}
export async function updateRecruiterJob(id: string, input: JobInput) {
  const token = await csrf();
  const result = await apiClient.PUT('/recruiter/jobs/{jobId}', { params: { path: { jobId: z.uuid().parse(id) } }, body: input, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobSchema.parse(result.data);
}
export async function deleteRecruiterJob(id: string) {
  const token = await csrf();
  const result = await apiClient.DELETE('/recruiter/jobs/{jobId}', { params: { path: { jobId: z.uuid().parse(id) } }, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
}
export async function publishRecruiterJob(id: string) {
  const token = await csrf();
  const result = await apiClient.POST('/recruiter/jobs/{jobId}/publish', { params: { path: { jobId: z.uuid().parse(id) } }, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobSchema.parse(result.data);
}
export async function changeRecruiterJobStatus(id: string, action: import('@/features/jobs/job-status').JobStatusAction) {
  const endpoints = { pause: '/recruiter/jobs/{jobId}/pause', reopen: '/recruiter/jobs/{jobId}/reopen', close: '/recruiter/jobs/{jobId}/close' } as const;
  const token = await csrf();
  const result = await apiClient.POST(endpoints[action], { params: { path: { jobId: z.uuid().parse(id) } }, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobSchema.parse(result.data);
}
