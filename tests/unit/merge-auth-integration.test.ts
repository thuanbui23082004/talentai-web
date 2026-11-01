import { beforeEach, expect, it } from 'vitest';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { resetMockAuth } from '@/server/bff/mock-auth-store';

beforeEach(resetMockAuth);

it('requires login for recruiter data and revokes access on logout', async () => {
  const request = (path: string, init?: RequestInit) => handleMockRequest(new Request(`http://localhost/api/bff/${path}`, init));
  expect((await request('auth/csrf')).status).toBe(401);
  expect((await request('recruiter/jobs')).status).toBe(401);
  const login = await request('auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter@example.test', password: 'TalentAI2026!' }),
  });
  expect(login.status).toBe(200);
  const { csrfToken } = await login.json();
  const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  expect((await request('recruiter/jobs', { headers: { cookie } })).status).toBe(200);
  expect((await request('recruiter/jobs', {
    method: 'POST', headers: { cookie, 'x-csrf-token': csrfToken, origin: 'https://other.example' }, body: '{}',
  })).status).toBe(403);
  expect((await request('auth/logout', { method: 'POST', headers: { cookie, 'x-csrf-token': csrfToken } })).status).toBe(204);
  expect((await request('recruiter/jobs', { headers: { cookie } })).status).toBe(401);
});
