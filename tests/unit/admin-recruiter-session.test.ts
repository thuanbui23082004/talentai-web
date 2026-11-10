import { expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { createMockRecruiterSession, getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { mockAdmin, mockAdminPassword } from '@/mocks/fixtures/admin';

test('admin login does not replace the recruiter identity in the same browser', async () => {
  const recruiter = createMockRecruiterSession();
  const login = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/login', {
    method: 'POST', headers: { cookie: `talentai_mock_session=${recruiter.id}` },
    body: JSON.stringify({ email: mockAdmin.email, password: mockAdminPassword }),
  }), 'auth/login');
  expect(login.status).toBe(200);
  expect(login.cookies.get('talentai_mock_session')).toBeUndefined();
  const adminId = login.cookies.get('talentai_mock_admin_session')?.value;
  expect(adminId).toBeTruthy();
  expect(getRecruiterMockStore().sessions.has(recruiter.id)).toBe(true);
  const cookie = `talentai_mock_session=${recruiter.id}; talentai_mock_admin_session=${adminId}`;
  const account = await handleMockRequest(new NextRequest('http://localhost/api/bff/me', { headers: { cookie } }), 'me');
  expect((await account.json()).role).toBe('recruiter');
  const stats = await handleMockRequest(new NextRequest('http://localhost/api/bff/admin/stats/overview', { headers: { cookie } }), 'admin/stats/overview');
  expect(stats.status).toBe(200);
  const csrf = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/csrf', { headers: { cookie, 'X-TalentAI-Workspace': 'admin' } }), 'auth/csrf');
  const { csrfToken } = await csrf.json();
  const logout = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/logout', { method: 'POST', headers: { cookie, 'X-TalentAI-Workspace': 'admin', 'X-CSRF-Token': csrfToken } }), 'auth/logout');
  expect(logout.status).toBe(204);
  expect(getRecruiterMockStore().sessions.has(recruiter.id)).toBe(true);
  expect(getRecruiterMockStore().sessions.has(adminId ?? '')).toBe(false);
});

test('recruiter bootstrap repairs the legacy admin cookie without returning admin information', async () => {
  const id = 'legacy-admin-session';
  getRecruiterMockStore().sessions.set(id, { role: 'admin', csrf: 'legacy', userId: mockAdmin.id });
  const result = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/csrf', { headers: { cookie: `talentai_mock_session=${id}` } }), 'auth/csrf');
  const replacement = result.cookies.get('talentai_mock_session')?.value;
  expect(replacement).toBeTruthy();
  expect(getRecruiterMockStore().sessions.get(replacement ?? '')?.role).toBe('recruiter');
});
