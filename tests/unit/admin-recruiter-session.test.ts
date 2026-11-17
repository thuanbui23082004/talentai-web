import { expect, test } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { mockAdmin, mockAdminPassword } from '@/mocks/fixtures/admin';
import { createMockRecruiterSession } from '../support/auth-fixtures';

test('admin login does not replace the recruiter identity in the same browser', async () => {
  const recruiter = createMockRecruiterSession();
  const login = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/login', {
    method: 'POST', headers: { cookie: `access_token=${recruiter.id}`, 'X-TalentAI-Workspace': 'admin' },
    body: JSON.stringify({ email: mockAdmin.email, password: mockAdminPassword }),
  }), 'auth/login');
  expect(login.status).toBe(200);
  const cookies = new NextResponse(null, { headers: login.headers }).cookies;
  expect(cookies.get('access_token')).toBeUndefined();
  const adminId = cookies.get('talentai_mock_admin_session')?.value;
  expect(adminId).toBeTruthy();
  expect(getRecruiterMockStore().workspaces.has(recruiter.session.userId!)).toBe(true);
  const cookie = `access_token=${recruiter.id}; talentai_mock_admin_session=${adminId}`;
  const account = await handleMockRequest(new NextRequest('http://localhost/api/bff/me', { headers: { cookie } }), 'me');
  expect((await account.json()).role).toBe('recruiter');
  const stats = await handleMockRequest(new NextRequest('http://localhost/api/bff/admin/stats/overview', { headers: { cookie } }), 'admin/stats/overview');
  expect(stats.status).toBe(200);
  const csrf = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/csrf', { headers: { cookie, 'X-TalentAI-Workspace': 'admin' } }), 'auth/csrf');
  const { csrfToken } = await csrf.json();
  const logout = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/logout', { method: 'POST', headers: { cookie, 'X-TalentAI-Workspace': 'admin', 'X-CSRF-Token': csrfToken } }), 'auth/logout');
  expect(logout.status).toBe(204);
  expect(getRecruiterMockStore().workspaces.has(recruiter.session.userId!)).toBe(true);
  expect(getRecruiterMockStore().sessions.has(adminId ?? '')).toBe(false);
});

test('legacy admin cookie cannot authorize the recruiter workspace', async () => {
  const id = 'legacy-admin-session';
  getRecruiterMockStore().sessions.set(id, { role: 'admin', csrf: 'legacy', userId: mockAdmin.id });
  const result = await handleMockRequest(new NextRequest('http://localhost/api/bff/me', { headers: { cookie: `talentai_mock_session=${id}` } }), 'me');
  expect(result.status).toBe(401);
  expect(new NextResponse(null, { headers: result.headers }).cookies.get('access_token')).toBeUndefined();
});
