import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { adminJobs, jobHistories } from '@/server/bff/admin-jobs-store';
import { getRecruiterMockStore, getDeletedJobIds, getMockCompanies, createMockRecruiterSession } from '@/server/bff/recruiter/mock-store';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { mockAdminJobs } from '@/mocks/fixtures/admin-jobs';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { recruiterCompany } from '@/mocks/fixtures/recruiter-company';
import { canModerateJob, filterAdminJobs } from '@/features/admin/job-rules';
import { managedJobSchema, jobReasonSchema, deleteJobReasonSchema } from '@/features/admin/schemas/jobs';
import { moderateJob } from '@/features/admin/services/jobs';
import { apiClient } from '@/lib/api';
import { formatVND } from '@/lib/utils';
const target = mockAdminJobs[0].id;
beforeEach(() => {
  getRecruiterMockStore().jobs = structuredClone(mockJobs); getDeletedJobIds().clear(); jobHistories().clear();
  getMockCompanies().clear(); getMockCompanies().set(recruiterCompany.id, structuredClone(recruiterCompany));
  getRecruiterMockStore().sessions.set('admin-job-test', { role: 'admin', userId: mockAdmin.id, csrf: 'csrf-job' });
  adminJobs();
});
function call(path: string, method = 'GET', body?: unknown, csrf = 'csrf-job') {
  return handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: { cookie: 'talentai_mock_admin_session=admin-job-test', 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) }), path.split('?')[0]);
}
test('filters title/company/status and validates action availability and reason', () => {
  const jobs = mockAdminJobs.map(job => managedJobSchema.parse(job));
  expect(filterAdminJobs(jobs, 'PHÁT TRIỂN', jobs[0].company.id, 'pending_review').map(job => job.id)).toEqual([target]);
  expect(canModerateJob('open', 'approve')).toBe(false); expect(canModerateJob('hidden', 'hide')).toBe(false); expect(canModerateJob('locked', 'lock')).toBe(false);
  expect(jobReasonSchema.safeParse({ reason: '  ' }).success).toBe(false); expect(jobReasonSchema.safeParse({ reason: 'x'.repeat(1001) }).success).toBe(false);
  expect(formatVND(10000000)).toBe('10,000,000 VNĐ');
});
test('list filters multiple states and paginates without exposing deleted jobs', async () => {
  const path = `admin/jobs?companyId=${mockAdminJobs[0].company.id}&status=open&status=pending_review&pageSize=1`;
  const result = await call(path); const data = await result.json();
  expect(result.status).toBe(200); expect(data.items).toHaveLength(1); expect(data.meta.totalItems).toBe(3); expect(data.meta.totalPages).toBe(3);
  const empty = await call('admin/stats/overview?from=2099-01-01');
  expect((await empty.json()).jobs.byStatus.open).toBe(0);
});
test('approve, hide, lock and delete update shared records and audit atomically', async () => {
  const count = getAdminActivity().length;
  const before = await call('admin/stats/overview'); const open = (await before.json()).jobs.byStatus.open;
  expect((await call(`admin/jobs/${target}/approve`, 'POST', { note: 'Đã kiểm duyệt nội dung' })).status).toBe(200);
  const overview = await call('admin/stats/overview'); expect((await overview.json()).jobs.byStatus.open).toBe(open + 1);
  expect((await call(`admin/jobs/${target}/approve`, 'POST', { note: 'Lặp lại' })).status).toBe(409);
  expect(getAdminActivity()).toHaveLength(count + 1);
  expect((await call(`admin/jobs/${target}/hide`, 'POST', { reason: 'Cần kiểm tra lại' })).status).toBe(200);
  expect((await call(`admin/jobs/${target}/lock`, 'POST', { reason: 'Vi phạm nội dung mẫu' })).status).toBe(200);
  expect(getRecruiterMockStore().jobs.find(job => job.id === target)?.status).toBe('locked');
  expect((await call(`admin/jobs/${target}?reason=Tin-vi-pham-mau`, 'DELETE')).status).toBe(204);
  expect((await call(`admin/jobs/${target}`)).status).toBe(404);
  expect(adminJobs().some(job => job.id === target)).toBe(false);
  expect(getAdminActivity()[0]).toMatchObject({ action: 'job.delete', targetId: target, actorId: mockAdmin.id });
  expect(jobHistories().get(target)).toHaveLength(4);
});
test('reject records the reason and cannot be approved without resubmission', async () => {
  const result = await call(`admin/jobs/${target}/reject`, 'POST', { reason: 'Nội dung cần bổ sung' });
  expect(result.status).toBe(200); expect((await result.json()).moderation.reason).toBe('Nội dung cần bổ sung');
  expect((await call(`admin/jobs/${target}/approve`, 'POST', { note: 'Không hợp lệ' })).status).toBe(409);
});
test('company verification, permissions and CSRF failures do not mutate jobs', async () => {
  getMockCompanies().get(mockAdminJobs[0].company.id)!.verificationStatus = 'suspended';
  expect((await call(`admin/jobs/${target}/approve`, 'POST', { note: 'Không được phép' })).status).toBe(422);
  expect((await call(`admin/jobs/${target}/lock`, 'POST', { reason: 'Kiểm tra' }, 'wrong')).status).toBe(403);
  expect((await call(`admin/jobs/${target}/lock`, 'POST', { reason: '' })).status).toBe(422);
  expect(jobHistories().get(target)).toBeUndefined();
  getRecruiterMockStore().sessions.set('admin-job-test', { role: 'recruiter', csrf: 'csrf-job' });
  expect((await call(`admin/jobs/${target}`)).status).toBe(403);
});
test('sensitive deletion reasons are rejected before any API request', async () => {
  expect(deleteJobReasonSchema.safeParse({ reason: 'Liên hệ demo@example.test' }).success).toBe(false);
  expect(deleteJobReasonSchema.safeParse({ reason: 'Số liên hệ +84 900 000 000' }).success).toBe(false);
  const spy = vi.spyOn(apiClient, 'GET');
  try {
    await expect(moderateJob(target, 'delete', 'demo@example.test')).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  } finally { spy.mockRestore(); }
});
test('recruiter reads the same status and moderation reason after admin approval', async () => {
  const auth = createMockRecruiterSession(); const job = getRecruiterMockStore().jobs[0]; job.status = 'pending_review';
  await call(`admin/jobs/${job.id}/approve`, 'POST', { note: 'Nội dung mẫu đã được duyệt' });
  const path = `recruiter/jobs/${job.id}`;
  const result = await handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { headers: { cookie: `talentai_mock_session=${auth.id}` } }), path);
  expect(result.status).toBe(200); const data = await result.json(); expect(data.status).toBe('open'); expect(data.moderation.reason).toBe('Nội dung mẫu đã được duyệt');
});

