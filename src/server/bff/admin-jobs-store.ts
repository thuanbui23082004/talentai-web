import type { components } from '@/lib/api/generated/schema';
import { getRecruiterMockStore, getDeletedJobIds, getMockCompanies } from '@/server/bff/recruiter/mock-store';
import { adminCompanies } from '@/server/bff/admin-companies-store';
import { mockAdminJobs } from '@/mocks/fixtures/admin-jobs';
import { jobStatuses } from '@/lib/api/job-schemas';
const shared = globalThis as typeof globalThis & { talentaiJobHistory?: Map<string, components['schemas']['ModerationEntry'][]> };
export function jobHistories() { return shared.talentaiJobHistory ??= new Map(); }
export function adminJobs() {
  adminCompanies();
  const jobs = getRecruiterMockStore().jobs;
  for (const fixture of mockAdminJobs) if (!jobs.some(job => job.id === fixture.id) && !getDeletedJobIds().has(fixture.id)) jobs.push(structuredClone(fixture));
  return jobs.filter(job => !getDeletedJobIds().has(job.id));
}
export function adminJobDetail(id: string): components['schemas']['AdminJob'] | undefined {
  const job = adminJobs().find(item => item.id === id); if (!job) return;
  const company = getMockCompanies().get(job.company.id);
  return { ...job, company: company ? { id: company.id, name: company.name, logoUrl: company.logoUrl, isVerified: company.verificationStatus === 'verified' } : job.company, history: jobHistories().get(id) ?? [] };
}
export function adminJobOverview() {
  const jobs = adminJobs(); const byStatus: Record<string, number> = Object.fromEntries(jobStatuses.map(status => [status, 0]));
  for (const job of jobs) byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
  return { total: jobs.length, byStatus };
}
