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
  await csrf();
  const result = await apiClient.GET('/recruiter/jobs/{jobId}', { params: { path: { jobId: id } } });
  if (result.error) throw jobRequestError(result.error, result.response.status);
  return recruiterJobSchema.parse(result.data);
}
