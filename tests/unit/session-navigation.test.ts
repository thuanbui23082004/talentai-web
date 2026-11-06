import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';
import { readServerSession } from '@/server/bff/auth/session';
import { handleAuthRequest } from '@/server/bff/auth/handler';

vi.mock('@/server/bff/auth/session', () => ({ readServerSession: vi.fn() }));
vi.mock('@/server/bff/auth/handler', () => ({ handleAuthRequest: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const request = () => new NextRequest('http://localhost/recruiter/jobs/create', { headers: { cookie: 'refresh_token=old' } });

it('forwards refreshed cookies to both server rendering and the browser without redirecting', async () => {
  vi.mocked(readServerSession).mockResolvedValue(null);
  const renewed = NextResponse.json({});
  renewed.cookies.set('access_token', 'new-access', { httpOnly: true, path: '/' });
  renewed.cookies.set('refresh_token', 'new-refresh', { httpOnly: true, path: '/' });
  vi.mocked(handleAuthRequest).mockResolvedValue(renewed);
  const response = await proxy(request());
  expect(response.headers.get('location')).toBeNull();
  expect(response.headers.get('x-middleware-request-cookie')).toContain('access_token=new-access');
  expect(response.headers.get('set-cookie')).toContain('refresh_token=new-refresh');
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');
});

it('keeps cookies on outages instead of redirecting to login', async () => {
  vi.mocked(readServerSession).mockRejectedValue(new Error('offline'));
  const response = await proxy(request());
  expect(response.status).toBe(503);
  expect(response.headers.get('location')).toBeNull();
  expect(response.cookies.getAll()).toEqual([]);
});

it('redirects to login when refresh has expired', async () => {
  vi.mocked(readServerSession).mockResolvedValue(null);
  const expired = NextResponse.json({}, { status: 401 });
  expired.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
  vi.mocked(handleAuthRequest).mockResolvedValue(expired);
  const response = await proxy(request());
  expect(response.headers.get('location')).toBe('http://localhost/login?reason=expired');
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
});
