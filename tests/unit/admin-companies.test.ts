import { beforeEach, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { adminCompanies, companyHistories, previousCompanyStatuses } from '@/server/bff/admin-companies-store';
import { getVerificationFiles } from '@/server/bff/company-verification-store';
import { getRecruiterMockStore, getMockCompanies, createMockRecruiterSession } from '@/server/bff/recruiter/mock-store';
import { syntheticCompanyDocument } from '@/mocks/fixtures/company-verification-document';
import { mockAdminCompanies } from '@/mocks/fixtures/admin-companies';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { recruiterCompany } from '@/mocks/fixtures/recruiter-company';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { canModerateCompany, filterCompanies } from '@/features/admin/company-rules';
import { managedCompanySchema, companyReasonSchema } from '@/features/admin/schemas/companies';
const target = mockAdminCompanies[0].id;
beforeEach(() => {
  getMockCompanies().clear(); getMockCompanies().set(recruiterCompany.id, structuredClone(recruiterCompany));
  companyHistories().clear(); previousCompanyStatuses().clear(); getVerificationFiles().clear();
  getRecruiterMockStore().jobs = structuredClone(mockJobs);
  getRecruiterMockStore().sessions.set('admin-company-test', { role: 'admin', userId: mockAdmin.id, csrf: 'csrf-company' });
  adminCompanies();
});
function call(path: string, method = 'GET', body?: unknown, csrf = 'csrf-company') {
  return handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: { cookie: 'talentai_mock_admin_session=admin-company-test', 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) }), path.split('?')[0]);
}
test('company search, status filters and moderation rules', () => {
  const rows = mockAdminCompanies.map(c => managedCompanySchema.parse(c));
  expect(filterCompanies(rows, 'BÌNH MINH', 'pending').map(c => c.id)).toEqual([target]);
  expect(filterCompanies(rows, '0000000001', '').map(c => c.id)).toEqual([target]);
  expect(canModerateCompany('unverified', 'verify')).toBe(false);
  expect(canModerateCompany('pending', 'reject')).toBe(true);
  expect(canModerateCompany('verified', 'restore')).toBe(false);
  expect(companyReasonSchema.safeParse({ reason: ' ' }).success).toBe(false);
  expect(companyReasonSchema.safeParse({ reason: 'x'.repeat(1001) }).success).toBe(false);
});
test('listing paginates and status filter obeys the API contract', async () => {
  const result = await call('admin/companies?verificationStatus=pending&pageSize=2');
  expect(result.status).toBe(200); const body = await result.json();
  expect(body.items).toHaveLength(2); expect(body.meta.totalPages).toBeGreaterThan(1);
  expect(body.items.every((item: { verificationStatus: string }) => item.verificationStatus === 'pending')).toBe(true);
});
test('verify updates the shared company, history, audit and dashboard pending count once', async () => {
  const before = await call('admin/stats/overview'); const count = (await before.json()).companies.pending;
  const result = await call(`admin/companies/${target}/verify`, 'POST', { note: 'Đã kiểm tra giấy tờ mẫu' });
  expect(result.status).toBe(200); const data = await result.json();
  expect(data.verificationStatus).toBe('verified'); expect(data.history[0]).toMatchObject({ action: 'verify', reason: 'Đã kiểm tra giấy tờ mẫu' });
  expect(getMockCompanies().get(target)?.verificationStatus).toBe('verified');
  const overview = await call('admin/stats/overview'); expect((await overview.json()).companies.pending).toBe(count - 1);
  const logs = await call('admin/activity-logs?pageSize=1'); expect((await logs.json()).items[0]).toMatchObject({ action: 'company.verify', targetId: target });
  expect((await call(`admin/companies/${target}/verify`, 'POST', { note: 'Lặp lại' })).status).toBe(422);
  expect(companyHistories().get(target)).toHaveLength(1);
});
test('reject requires reason and blocks later approval until resubmission', async () => {
  expect((await call(`admin/companies/${target}/reject`, 'POST', { reason: '' })).status).toBe(422);
  const result = await call(`admin/companies/${target}/reject`, 'POST', { reason: 'Cần bổ sung giấy tờ' });
  expect((await result.json()).rejectionReason).toBe('Cần bổ sung giấy tờ');
  expect((await call(`admin/companies/${target}/verify`, 'POST', { note: 'Không được duyệt hồ sơ bị từ chối' })).status).toBe(422);
});
test('suspension hides only owned open jobs and restore does not reopen them', async () => {
  const store = getRecruiterMockStore();
  const job = { ...structuredClone(store.jobs[0]), id: '00000000-0000-4000-8000-000000007001', company: { id: target, name: 'Doanh nghiệp mẫu' }, status: 'open' as const };
  store.jobs.push(job);
  const other = store.jobs.find(row => row.company.id !== target && row.status === 'open');
  expect((await call(`admin/companies/${target}/suspend`, 'POST', { reason: 'Kiểm tra vi phạm mẫu' })).status).toBe(200);
  expect(job.status).toBe('hidden'); expect(other?.status).toBe('open');
  expect((await call(`admin/companies/${target}/restore`, 'POST', { note: 'Đã kiểm tra lại' })).status).toBe(200);
  expect(getMockCompanies().get(target)?.verificationStatus).toBe('pending'); expect(job.status).toBe('hidden');
});
test('documents are private, binary, scoped to their own company and require admin access', async () => {
  const id = mockAdminCompanies[0].verificationDocuments?.[0].id ?? '';
  const result = await call(`admin/companies/${target}/documents/${id}`);
  expect(result.status).toBe(200); expect(result.headers.get('content-type')).toBe('application/pdf');
  expect(new TextDecoder().decode(await result.arrayBuffer()).startsWith('%PDF-')).toBe(true);
  expect((await call(`admin/companies/${mockAdminCompanies[1].id}/documents/${id}`)).status).toBe(404);
  const request = new NextRequest(`http://localhost/api/bff/admin/companies/${target}/documents/${id}`);
  expect((await handleMockRequest(request, `admin/companies/${target}/documents/${id}`)).status).toBe(401);
});
test('CSRF, role and missing document checks do not mutate the company', async () => {
  expect((await call(`admin/companies/${target}/verify`, 'POST', { note: 'Kiểm tra' }, 'wrong')).status).toBe(403);
  getMockCompanies().get(target)!.verificationDocuments = [];
  expect((await call(`admin/companies/${target}/verify`, 'POST', { note: 'Thiếu giấy tờ' })).status).toBe(422);
  expect(getMockCompanies().get(target)?.verificationStatus).toBe('pending');
  expect(companyHistories().get(target)).toBeUndefined();
  getRecruiterMockStore().sessions.set('admin-company-test', { role: 'recruiter', csrf: 'csrf-company' });
  expect((await call(`admin/companies/${target}`)).status).toBe(403);
});
test('admin reads the exact verification file submitted by recruiter and sees the same company', async () => {
  const auth = createMockRecruiterSession(); const bytes = syntheticCompanyDocument(); const form = new FormData();
  form.append('files', new File([new Uint8Array(bytes)], 'verification.pdf', { type: 'application/pdf' }));
  const path = 'recruiter/company/verification-documents';
  const upload = await handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method: 'POST', headers: { cookie: `talentai_mock_session=${auth.id}`, 'X-CSRF-Token': auth.session.csrf }, body: form }), path);
  expect(upload.status).toBe(200); const company = await upload.json();
  const file = await call(`admin/companies/${recruiterCompany.id}/documents/${company.verificationDocuments[0].id}`);
  expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
  expect((await call(`admin/companies/${recruiterCompany.id}/verify`, 'POST', { note: 'Giấy tờ mẫu hợp lệ' })).status).toBe(200);
  const own = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/company', { headers: { cookie: `talentai_mock_session=${auth.id}` } }), 'recruiter/company');
  expect((await own.json()).verificationStatus).toBe('verified');
});
test('recruiter cannot reopen paused jobs while its company is suspended', async () => {
  const auth = createMockRecruiterSession(); const store = getRecruiterMockStore();
  const job = { ...structuredClone(store.jobs[0]), id: '00000000-0000-4000-8000-000000007002', company: { id: recruiterCompany.id, name: recruiterCompany.name }, status: 'paused' as const }; store.jobs.push(job);
  await call(`admin/companies/${recruiterCompany.id}/suspend`, 'POST', { reason: 'Doanh nghiệp đang bị kiểm tra' });
  const path = `recruiter/jobs/${job.id}/reopen`;
  const reopen = () => handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method: 'POST', headers: { cookie: `talentai_mock_session=${auth.id}`, 'X-CSRF-Token': auth.session.csrf } }), path);
  expect((await reopen()).status).toBe(409);
  const uploadPath = 'recruiter/company/verification-documents'; const form = new FormData();
  form.append('files', new File([syntheticCompanyDocument()], 'example.pdf', { type: 'application/pdf' }));
  const upload = await handleMockRequest(new NextRequest(`http://localhost/api/bff/${uploadPath}`, { method: 'POST', headers: { cookie: `talentai_mock_session=${auth.id}`, 'X-CSRF-Token': auth.session.csrf }, body: form }), uploadPath);
  expect(upload.status).toBe(403);
  expect(getMockCompanies().get(recruiterCompany.id)?.verificationStatus).toBe('suspended');
  await call(`admin/companies/${recruiterCompany.id}/restore`, 'POST', { note: 'Đã xử lý' });
  expect((await reopen()).status).toBe(200);
});
