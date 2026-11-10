import { describe, expect, it, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { loginSchema, periodSchema } from '@/features/admin/schemas';
import { handleAdminRequest } from '@/server/bff/admin-handler';
import { getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { mockAdmin, mockAdminPassword } from '@/mocks/fixtures/admin';

describe('admin authentication and dashboard mock', () => {
  beforeEach(() => getRecruiterMockStore().sessions.clear());
  const request = (path: string) => new NextRequest(`http://localhost/api/bff/${path}`);
  it('validates login and rejects reversed date ranges', () => {
    expect(loginSchema.safeParse({ email: 'invalid', password: '' }).success).toBe(false);
    expect(periodSchema.safeParse({ from: '2026-11-05', to: '2026-11-01' }).success).toBe(false);
  });
  it('rejects unauthenticated requests and non-admin roles', async () => {
    expect((await handleAdminRequest(request('admin/stats/overview'), 'admin/stats/overview'))?.status).toBe(401);
    expect((await handleAdminRequest(request('admin/stats/overview'), 'admin/stats/overview', { role: 'recruiter', csrf: 'fake' }))?.status).toBe(403);
  });
  it('creates an httpOnly admin session only with matching mock credentials', async () => {
    const login = (password: string) => handleAdminRequest(new NextRequest('http://localhost/api/bff/auth/login', { method: 'POST', body: JSON.stringify({ email: mockAdmin.email, password }) }), 'auth/login');
    expect((await login('wrong'))?.status).toBe(401);
    expect(getRecruiterMockStore().sessions.size).toBe(0);
    const result = await login(mockAdminPassword);
    expect(result?.status).toBe(200);
    expect(result?.headers.get('set-cookie')).toContain('HttpOnly');
    expect([...getRecruiterMockStore().sessions.values()][0].role).toBe('admin');
  });
  it('filters series and yields no records outside fixture dates', async () => {
    const path = 'admin/stats/timeseries';
    const session = { role: 'admin' as const, csrf: 'fake' };
    const result = await handleAdminRequest(request(`${path}?metric=applications&from=2026-11-02&to=2026-11-02`), path, session);
    expect((await result?.json()).points).toEqual([{ date: '2026-11-02', value: 115 }]);
    const empty = await handleAdminRequest(request(`${path}?metric=applications&from=2099-01-01`), path, session);
    expect((await empty?.json()).points).toEqual([]);
  });
  it('requires CSRF for logout and revokes the session', async () => {
    const store = getRecruiterMockStore(); const session = { role: 'admin' as const, csrf: 'fake' }; store.sessions.set('test', session);
    const call = (csrf: string) => handleAdminRequest(new NextRequest('http://localhost/api/bff/auth/logout', { method: 'POST', headers: { cookie: 'talentai_mock_admin_session=test', 'X-CSRF-Token': csrf } }), 'auth/logout', session);
    expect((await call('wrong'))?.status).toBe(403);
    expect(store.sessions.has('test')).toBe(true);
    expect((await call('fake'))?.status).toBe(204);
    expect(store.sessions.has('test')).toBe(false);
  });
});
