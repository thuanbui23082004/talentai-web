import { beforeEach, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { getAdminUsers, getAdminActivity } from '@/server/bff/admin-users-store';
import { mockManagedUsers } from '@/mocks/fixtures/admin-users';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { filterUsers } from '@/features/admin/users-filter';
import { managedUserSchema, reasonSchema } from '@/features/admin/schemas/users';
const target = mockManagedUsers[2].id;
beforeEach(() => {
  for (const user of structuredClone(mockManagedUsers)) getAdminUsers().set(user.id, user);
  getRecruiterMockStore().sessions.set('admin-users-test', { role: 'admin', userId: mockAdmin.id, csrf: 'csrf-test' });
});
function call(path: string, method = 'GET', body?: unknown, csrf = 'csrf-test') {
  return handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: { cookie: 'talentai_mock_admin_session=admin-users-test', 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) }), path.split('?')[0]);
}
test('filters account names, email, role and status locally', () => {
  const users = mockManagedUsers.map(user => managedUserSchema.parse(user));
  expect(filterUsers(users, 'USER3@EXAMPLE.TEST', 'candidate', 'active').map(user => user.id)).toEqual([target]);
  expect(filterUsers(users, 'Gia Hân', 'recruiter', '').length).toBe(0);
  expect(reasonSchema.safeParse({ reason: '  ' }).success).toBe(false);
  expect(reasonSchema.safeParse({ reason: 'x'.repeat(1001) }).success).toBe(false);
});
test('list filters and pagination match contract metadata', async () => {
  const result = await call('admin/users?role=candidate&status=active&page=1&pageSize=2');
  expect(result.status).toBe(200);
  const data = await result.json();
  expect(data.items).toHaveLength(2);
  expect(data.items.every((item: { role: string; status: string }) => item.role === 'candidate' && item.status === 'active')).toBe(true);
  expect(data.meta.totalPages).toBeGreaterThan(1);
});
test('lock revokes sessions and writes one audit record, unlock writes its reason', async () => {
  getRecruiterMockStore().sessions.set('target-session', { role: 'candidate', userId: target, csrf: 'target-csrf' });
  const count = getAdminActivity().length;
  const lock = await call(`admin/users/${target}/lock`, 'POST', { reason: 'Nội dung vi phạm mẫu' });
  expect(lock.status).toBe(200);
  expect((await lock.json()).status).toBe('locked');
  expect(getRecruiterMockStore().sessions.has('target-session')).toBe(false);
  expect(getAdminActivity()).toHaveLength(count + 1);
  expect(getAdminActivity()[0]).toMatchObject({ action: 'user.lock', actorId: mockAdmin.id, targetId: target, metadata: { reason: 'Nội dung vi phạm mẫu' } });
  expect((await call(`admin/users/${target}/lock`, 'POST', { reason: 'Lặp lại' })).status).toBe(422);
  expect(getAdminActivity()).toHaveLength(count + 1);
  expect((await call(`admin/users/${target}/unlock`, 'POST', { note: 'Đã kiểm tra lại' })).status).toBe(200);
  expect(getAdminUsers().get(target)?.status).toBe('active');
  const history = await call(`admin/users/${target}/activity`);
  expect((await history.json()).items[0]).toMatchObject({ action: 'user.unlock', metadata: { reason: 'Đã kiểm tra lại' } });
});
test('invalid input, missing CSRF and non-admin roles never mutate the account', async () => {
  expect((await call(`admin/users/${target}/lock`, 'POST', { reason: 'Valid' }, 'wrong')).status).toBe(403);
  expect((await call(`admin/users/${target}/lock`, 'POST', { reason: ' ' })).status).toBe(422);
  expect(getAdminUsers().get(target)?.status).toBe('active');
  const result = await handleMockRequest(new NextRequest(`http://localhost/api/bff/admin/users/${target}/lock`, { method: 'POST', body: JSON.stringify({ reason: 'Invalid actor' }) }), `admin/users/${target}/lock`);
  expect(result.status).toBe(401);
  getRecruiterMockStore().sessions.set('not-admin', { role: 'candidate', csrf: 'csrf-test', userId: target });
  const forbidden = await handleMockRequest(new NextRequest(`http://localhost/api/bff/admin/users/${target}`, { headers: { cookie: 'talentai_mock_admin_session=not-admin' } }), `admin/users/${target}`);
  expect(forbidden.status).toBe(403);
  getRecruiterMockStore().sessions.set('admin-users-test', { role: 'admin', userId: target, csrf: 'csrf-test' });
  expect((await call(`admin/users/${target}/lock`, 'POST', { reason: 'Không được tự khóa' })).status).toBe(403);
  expect((await call('admin/users/not-a-user')).status).toBe(404);
});
