import { beforeEach, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { catalogStore, getCatalogItems } from '@/server/bff/catalog-store';
import { reportStore } from '@/server/bff/admin-reports-handler';
import { getRecruiterMockStore, getDeletedJobIds } from '@/server/bff/recruiter/mock-store';
import { getAdminActivity, getAdminUsers } from '@/server/bff/admin-users-store';
import { adminJobs } from '@/server/bff/admin-jobs-store';
import { mockReports } from '@/mocks/fixtures/admin-content';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { allowedReportActions } from '@/features/admin/schemas/content';
const snapshot = structuredClone([...catalogStore().values()]);
beforeEach(() => {
  catalogStore().clear(); for (const row of structuredClone(snapshot)) catalogStore().set(row.id, row);
  reportStore().clear(); for (const row of structuredClone(mockReports)) reportStore().set(row.id, row);
  getRecruiterMockStore().jobs = structuredClone(mockJobs); getDeletedJobIds().clear(); adminJobs();
  getRecruiterMockStore().sessions.set('content-test', { role: 'admin', userId: mockAdmin.id, csrf: 'content-csrf' });
});
function call(path: string, method = 'GET', body?: unknown, csrf = 'content-csrf', cookie = 'talentai_mock_admin_session=content-test') {
  return handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: { cookie, 'X-CSRF-Token': csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), path.split('?')[0]);
}
test('catalog CRUD, duplicate protection, active public choices and audit', async () => {
  const count = getAdminActivity().length;
  const created = await call('admin/catalog/skills', 'POST', { name: 'Kỹ năng thử nghiệm', aliases: ['Demo'], isActive: true }); expect(created.status).toBe(201); const item = await created.json();
  expect((await call('admin/catalog/skills', 'POST', { name: 'kỹ năng thử nghiệm', isActive: true })).status).toBe(409);
  expect((await call(`admin/catalog/skills/${item.id}`, 'PUT', { name: item.name, isActive: false })).status).toBe(200);
  const session = getRecruiterMockStore().sessions; session.set('public-content', { role: 'recruiter', csrf: 'public-csrf' });
  const choices = await call('catalog/skills', 'GET', undefined, 'public-csrf', 'talentai_mock_session=public-content'); expect((await choices.json()).items.some((row: { id: string }) => row.id === item.id)).toBe(false);
  expect((await call(`admin/catalog/skills/${item.id}`, 'DELETE')).status).toBe(204); expect(getAdminActivity()).toHaveLength(count + 3);
});
test('catalog usage blocks delete, rename preserves job references, parent cycles rejected', async () => {
  const industry = getCatalogItems('industries')[0];
  expect((await call(`admin/catalog/industries/${industry.id}`, 'DELETE')).status).toBe(409);
  const renamed = await call(`admin/catalog/industries/${industry.id}`, 'PUT', { name: 'Ngành công nghệ mẫu', isActive: false }); expect(renamed.status).toBe(200);
  expect(adminJobs().find(row => row.industry?.id === industry.id)?.industry?.name).toBe('Ngành công nghệ mẫu');
  expect((await call(`admin/catalog/industries/${industry.id}`, 'PUT', { name: industry.name, parentId: industry.id, isActive: true })).status).toBe(422);
});
test('catalog and reports require admin and valid CSRF', async () => {
  expect((await call('admin/catalog/skills', 'POST', { name: 'No', isActive: true }, 'bad')).status).toBe(403);
  expect((await call('admin/reports', 'GET', undefined, '', '')).status).toBe(401);
  getRecruiterMockStore().sessions.set('content-recruiter', { role: 'recruiter', csrf: 'x' });
  expect((await call('admin/catalog/skills', 'GET', undefined, 'x', 'talentai_mock_admin_session=content-recruiter')).status).toBe(403);
});
test('report start, hide target, resolution, response, audit and overview stay synchronized', async () => {
  const report = mockReports[0], count = getAdminActivity().length;
  expect((await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'hide_content', note: 'Kiểm tra', responseToReporter: '' })).status).toBe(422);
  expect((await call(`admin/reports/${report.id}/start-review`, 'POST', {})).status).toBe(200);
  const result = await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'hide_content', note: 'Nội dung vi phạm mẫu', responseToReporter: 'Đã tiếp nhận phản ánh.' }); expect(result.status).toBe(200);
  expect((await result.json()).status).toBe('resolved'); expect(adminJobs().find(row => row.id === report.targetId)?.status).toBe('hidden');
  expect(reportStore().get(report.id)?.history).toHaveLength(2); expect(getAdminActivity()).toHaveLength(count + 3);
  const finished = getAdminActivity().find(row => row.action === 'report.resolve' && row.targetId === report.id)!;
  const targetAction = getAdminActivity().find(row => row.action === 'job.hide' && row.targetId === report.targetId)!;
  expect(Date.parse(finished.occurredAt)).toBeGreaterThanOrEqual(Date.parse(targetAction.occurredAt));
  const overview = await call('admin/stats/overview'); expect((await overview.json()).reports.open).toBe(2);
  expect((await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'dismiss', note: 'Lặp lại', responseToReporter: '' })).status).toBe(422);
});
test('failed target moderation leaves report unchanged and unsupported actions are rejected', async () => {
  const report = reportStore().get(mockReports[1].id)!; const user = getAdminUsers().get(report.targetId!)!; user.status = 'locked';
  const count = getAdminActivity().length;
  const failed = await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'lock_target', note: 'Không được lặp', responseToReporter: '' }); expect(failed.status).toBe(422);
  expect(report.status).toBe('in_review'); expect(report.resolution).toBeUndefined(); expect(getAdminActivity()).toHaveLength(count);
  user.status = 'active';
  expect(allowedReportActions('system')).toEqual(['dismiss']);
  expect((await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'delete_content', note: 'Không hỗ trợ', responseToReporter: '' })).status).toBe(422);
  expect((await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'lock_target', note: 'Tài khoản vi phạm mẫu', responseToReporter: '' })).status).toBe(200); expect(user.status).toBe('locked'); user.status = 'active';
});
test('report filters, pagination, notes and safe deletion reason', async () => {
  const list = await call('admin/reports?status=open&targetType=job&pageSize=1'); expect((await list.json()).meta.totalItems).toBe(1);
  const report = mockReports[0]; await call(`admin/reports/${report.id}/start-review`, 'POST', {});
  expect((await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'delete_content', note: '   ', responseToReporter: '' })).status).toBe(422);
  expect((await call(`admin/reports/${report.id}/resolve`, 'POST', { action: 'delete_content', note: 'Thông tin mẫu demo@example.test', responseToReporter: '' })).status).toBe(200);
  expect(getDeletedJobIds().has(report.targetId!)).toBe(true); const log = getAdminActivity().find(row => row.action === 'job.delete' && row.targetId === report.targetId); expect(JSON.stringify(log?.metadata)).not.toContain('@');
});
