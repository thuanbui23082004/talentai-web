import { beforeEach, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { anomalyStore } from '@/server/bff/admin-monitoring-handler';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { mockAnomalies, mockSystemLogs } from '@/mocks/fixtures/admin-monitoring';
import { anomalySchema, systemLogSchema, anomalyReviewSchema } from '@/features/admin/schemas/monitoring';
import { filterAnomalies, filterSystemLogs } from '@/features/admin/monitoring-rules';
const filters = { search: '', level: '', source: '', from: '', to: '', severity: '', status: '', type: '' };
beforeEach(() => { anomalyStore().clear(); for (const row of structuredClone(mockAnomalies)) anomalyStore().set(row.id, row); getRecruiterMockStore().sessions.set('monitoring-test', { role: 'admin', csrf: 'monitoring-csrf', userId: '00000000-0000-4000-8000-000000000901' }); });
function call(path: string, method = 'GET', body?: unknown, csrf = 'monitoring-csrf', cookie = 'talentai_mock_admin_session=monitoring-test') { return handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: { cookie, 'X-CSRF-Token': csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), path.split('?')[0]); }
test('filter logs/anomalies, validate local date bounds and discard unapproved evidence fields', () => {
  const logs = systemLogSchema.array().parse(mockSystemLogs), anomalies = anomalySchema.array().parse(mockAnomalies);
  expect(filterSystemLogs(logs, { ...filters, search: 'REQ-DEMO-0003', level: 'error', source: 'recruitment-service' })).toHaveLength(1);
  expect(filterSystemLogs(logs, { ...filters, from: '2026-12-01', to: '2026-11-01' })).toHaveLength(0);
  expect(filterAnomalies(anomalies, { ...filters, status: 'open', type: 'repeated_login_failures', severity: 'high' }).map(row => row.id)).toEqual([anomalies[0].id]);
  expect(anomalySchema.parse({ ...mockAnomalies[0], evidence: { eventCount: 5, token: 'secret', cv: 'not-for-display' } }).evidence).toEqual({ eventCount: 5 });
  expect(anomalyReviewSchema.safeParse({ status: 'reviewed', note: '   ' }).success).toBe(false);
});
test('mock endpoints implement contract filters, paging and strict query validation', async () => {
  const logs = await call('admin/system-logs?level=error&source=recruitment-service&requestId=REQ-DEMO-0003&pageSize=1'); expect((await logs.json()).meta.totalItems).toBe(1);
  const anomalies = await call('admin/anomalies?status=open&severity=high&type=repeated_login_failures'); expect((await anomalies.json()).items).toHaveLength(1);
  expect((await call('admin/system-logs?from=bad')).status).toBe(422); expect((await call('admin/anomalies?severity=unknown')).status).toBe(422); expect((await call('admin/system-logs?page=0')).status).toBe(422);
});
test('review/dismiss update shared records and append exactly one audit event', async () => {
  const id = mockAnomalies[0].id, count = getAdminActivity().length;
  expect((await call(`admin/anomalies/${id}`, 'PATCH', { status: 'reviewed', note: 'Đã kiểm tra tình huống mẫu' })).status).toBe(200);
  expect(anomalyStore().get(id)).toMatchObject({ status: 'reviewed', reviewNote: 'Đã kiểm tra tình huống mẫu' }); expect(getAdminActivity()).toHaveLength(count + 1); expect(getAdminActivity()[0]).toMatchObject({ action: 'anomaly.review', targetId: id });
  expect((await call(`admin/anomalies/${id}`, 'PATCH', { status: 'dismissed', note: 'Lặp lại' })).status).toBe(422); expect(getAdminActivity()).toHaveLength(count + 1);
  expect((await call(`admin/anomalies/${mockAnomalies[1].id}`, 'PATCH', { status: 'dismissed' })).status).toBe(200);
});
test('anonymous/recruiter sessions and missing CSRF cannot update anomalies', async () => {
  const path = `admin/anomalies/${mockAnomalies[0].id}`, count = getAdminActivity().length;
  expect((await call('admin/system-logs', 'GET', undefined, '', '')).status).toBe(401); expect((await call(path, 'PATCH', { status: 'reviewed' }, 'bad')).status).toBe(403);
  getRecruiterMockStore().sessions.set('monitoring-recruiter', { role: 'recruiter', csrf: 'x' }); expect((await call('admin/anomalies', 'GET', undefined, 'x', 'talentai_mock_admin_session=monitoring-recruiter')).status).toBe(403);
  expect(anomalyStore().get(mockAnomalies[0].id)?.status).toBe('open'); expect(getAdminActivity()).toHaveLength(count);
});
