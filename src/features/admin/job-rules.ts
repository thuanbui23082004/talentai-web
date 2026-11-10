import type { JobAction, ManagedJob } from '@/features/admin/schemas/jobs';
export function canModerateJob(status: ManagedJob['status'], action: JobAction) {
  if (action === 'approve' || action === 'reject') return status === 'pending_review';
  if (action === 'hide') return status === 'open';
  if (action === 'lock') return status !== 'locked';
  return true;
}
export function filterAdminJobs(jobs: ManagedJob[], search: string, companyId: string, status: string) {
  const q = search.trim().toLocaleLowerCase('vi');
  return jobs.filter(job => (!status || job.status === status) && (!companyId || job.company.id === companyId) && (!q || job.title.toLocaleLowerCase('vi').includes(q) || job.company.name.toLocaleLowerCase('vi').includes(q)));
}
