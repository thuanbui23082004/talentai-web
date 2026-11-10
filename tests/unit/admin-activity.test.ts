import { expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { activityLogSchema } from '@/features/admin/schemas/activity-logs';
import { activityActionKey, activityTargetLink, emptyActivityFilters, filterActivityLogs, activityDay } from '@/features/admin/activity-rules';
import { additionalAdminActivity } from '@/mocks/fixtures/admin-activity';
const logs = activityLogSchema.array().parse(additionalAdminActivity);
function call(path: string, method = 'GET', authenticated = true) {
  getRecruiterMockStore().sessions.set('activity-test', { role: 'admin', csrf: 'activity-csrf', userId: '00000000-0000-4000-8000-000000000901' });
  return handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: authenticated ? { cookie: 'talentai_mock_admin_session=activity-test' } : {} }), path.split('?')[0]);
}
test('local filtering combines actor/action/target/result/search and inclusive Vietnamese calendar days', () => {
  const first = logs[0];
  expect(filterActivityLogs(logs, { ...emptyActivityFilters, actor: first.actorId!, action: first.action, target: first.targetType!, result: 'failure', search: 'KHÔNG THÀNH CÔNG', from: '2026-10-28', to: '2026-10-28' }).map(row => row.id)).toEqual([first.id]);
  expect(filterActivityLogs(logs, { ...emptyActivityFilters, from: '2026-11-01', to: '2026-10-01' })).toEqual([]);
  expect(activityDay('2026-10-27T18:00:00Z')).toBe('2026-10-28');
  expect(filterActivityLogs([{ ...first, occurredAt: '2026-10-27T18:00:00Z' }], { ...emptyActivityFilters, from: '2026-10-28', to: '2026-10-28' })).toHaveLength(1);
  expect(filterActivityLogs([{ ...first, actorRole: 'candidate' }], emptyActivityFilters)).toHaveLength(0);
});
test('metadata is whitelisted and target links only accept known types and UUIDs', () => {
  const log = activityLogSchema.parse({ ...logs[0], metadata: { reason: 'Ghi chú mẫu', token: 'private-value', cv: { content: 'not-for-display' } } });
  expect(log.metadata).toEqual({ reason: 'Ghi chú mẫu' });
  expect(activityTargetLink(log)).toBe(`/admin/jobs/${log.targetId}`);
  expect(activityTargetLink({ ...log, targetType: 'constructor' })).toBeNull();
  expect(activityTargetLink({ ...log, targetType: 'https://example.test', targetId: 'person@example.test' })).toBeNull();
  expect(activityTargetLink({ ...log, targetType: 'catalog' })).toBe('/admin/catalog');
  expect(activityActionKey('__proto__')).toBe('other');
});
test('events with equal timestamps preserve their existing newest-first causal order', () => {
  const recent = { ...logs[1], occurredAt: logs[0].occurredAt };
  expect(filterActivityLogs([recent, logs[0]], emptyActivityFilters).map(row => row.id)).toEqual([recent.id, logs[0].id]);
});
test('API supports documented filters, pagination and stable newest-first order', async () => {
  const first = logs[0];
  const response = await call(`admin/activity-logs?role=admin&userId=${first.actorId}&action=${first.action}&targetType=job&result=failure&pageSize=1`);
  expect(response.status).toBe(200); const data = await response.json(); expect(data.items[0].id).toBe(first.id); expect(data.meta.pageSize).toBe(1);
  const page = await call('admin/activity-logs?role=admin&page=2&pageSize=3'); const rows = await page.json(); expect(rows.items).toHaveLength(3); expect(Date.parse(rows.items[0].occurredAt)).toBeGreaterThanOrEqual(Date.parse(rows.items[1].occurredAt));
});
test('API compares actual timestamp bounds with offsets and rejects invalid query data', async () => {
  const response = await call('admin/activity-logs?role=admin&from=2026-10-28T00%3A00%3A00%2B07%3A00&to=2026-10-28T23%3A59%3A59%2B07%3A00');
  expect((await response.json()).items.map((row: { id: string }) => row.id)).toEqual([logs[0].id]);
  for (const query of ['page=0', 'pageSize=101', 'role=bad', 'result=bad', 'from=bad', 'userId=bad', 'from=2026-11-02T00:00:00Z&to=2026-11-01T00:00:00Z']) expect((await call(`admin/activity-logs?${query}`)).status).toBe(422);
});
test('logs remain read-only and require admin authorization', async () => {
  expect((await call('admin/activity-logs', 'GET', false)).status).toBe(401);
  getRecruiterMockStore().sessions.set('activity-recruiter', { role: 'recruiter', csrf: 'x' });
  const forbidden = await handleMockRequest(new NextRequest('http://localhost/api/bff/admin/activity-logs', { headers: { cookie: 'talentai_mock_admin_session=activity-recruiter' } }), 'admin/activity-logs'); expect(forbidden.status).toBe(403);
  expect((await call('admin/activity-logs', 'POST')).status).toBe(405);
});
