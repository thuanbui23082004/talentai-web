import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api';
import { adminWorkspaceHeaders } from '@/lib/api/workspace';
import { adminJobPageSchema, managedJobSchema, jobReasonSchema, deleteJobReasonSchema, type JobAction } from '@/features/admin/schemas/jobs';
export async function getAdminJobs(signal?: AbortSignal) {
  const jobs = []; let page = 1, pages = 1;
  do {
    const result = await apiClient.GET('/admin/jobs', { params: { query: { page, pageSize: 100, sort: 'newest' } }, signal });
    if (result.error) throw new ApiError('ADMIN_JOBS_FAILED', result.response.status, result.error);
    const data = adminJobPageSchema.parse(result.data); jobs.push(...data.items); pages = data.meta.totalPages; page++;
  } while (page <= pages);
  return jobs;
}
export async function getAdminJob(jobId: string, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/jobs/{jobId}', { params: { path: { jobId } }, signal });
  if (result.error) throw new ApiError('ADMIN_JOB_FAILED', result.response.status, result.error);
  return managedJobSchema.parse(result.data);
}
export async function moderateJob(jobId: string, action: JobAction, input: string) {
  const { reason } = (action === 'delete' ? deleteJobReasonSchema : jobReasonSchema).parse({ reason: input });
  const csrf = await apiClient.GET('/auth/csrf', { headers: adminWorkspaceHeaders });
  if (csrf.error) throw new ApiError('ADMIN_JOB_SESSION_FAILED', csrf.response.status, csrf.error);
  const token = z.object({ csrfToken: z.string() }).parse(csrf.data).csrfToken;
  const options = { params: { path: { jobId } }, headers: { ...adminWorkspaceHeaders, 'X-CSRF-Token': token } };
  if (action === 'delete') {
    const result = await apiClient.DELETE('/admin/jobs/{jobId}', { ...options, params: { path: { jobId }, query: { reason } } });
    if (result.error) throw new ApiError('ADMIN_JOB_DELETE_FAILED', result.response.status, result.error);
    return null;
  }
  const result = action === 'approve' ? await apiClient.POST('/admin/jobs/{jobId}/approve', { ...options, body: { note: reason } })
    : action === 'reject' ? await apiClient.POST('/admin/jobs/{jobId}/reject', { ...options, body: { reason } })
    : action === 'hide' ? await apiClient.POST('/admin/jobs/{jobId}/hide', { ...options, body: { reason } })
    : await apiClient.POST('/admin/jobs/{jobId}/lock', { ...options, body: { reason } });
  if (result.error) throw new ApiError('ADMIN_JOB_UPDATE_FAILED', result.response.status, result.error);
  return managedJobSchema.parse(result.data);
}
