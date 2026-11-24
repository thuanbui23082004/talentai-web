import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleAdminDashboard } from '@/server/bff/admin/dashboard-service';

const base = 'http://gateway.test/api/v1';
const token = 'dashboard-test-token';
const profile = (role: string) => ({ success: true, data: { profile: {
  id: '10000000-0000-4000-8000-000000000001', email: 'admin@example.test', displayName: 'Admin', status: 'ACTIVE', roles: [role],
} } });
function request(path: string) { return new Request(`http://localhost/api/bff/admin/${path}`, { headers: { cookie: `access_token=${token}` } }); }
function network(role = 'ADMIN') {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const path = String(url);
    if (path.endsWith('/auth/me')) return Response.json(profile(role));
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
    if (path.includes('verificationStatus=PENDING')) return Response.json({ data: { content: [], totalElements: 3, totalPages: 3 } });
    if (path.includes('/admin/reports?')) return Response.json({ code: 200, data: { totalElements: 2 } });
    if (path.includes('/jobs?')) return Response.json({ code: 200, data: { totalElements: 54 } });
    if (path.endsWith('/admin/orders/statistics')) return Response.json({ totalRevenue: 150000000 });
    if (path.includes('/admin/companies?')) return Response.json({ data: { content: [
      { createdAt: '2026-11-20T09:00:00Z' }, { createdAt: '2026-11-20T10:00:00Z' }, { createdAt: '2026-11-21T10:00:00Z' },
    ], totalElements: 50, totalPages: 1 } });
    if (path.includes('/admin/audit-logs?')) return Response.json({ code: 200, data: { content: [
      { id: '10000000-0000-4000-8000-000000000002', actorRole: 'ADMIN', action: 'VERIFY', description: 'Đã xác minh công ty', createdAt: '2026-11-21T10:00:00Z' },
      { id: '10000000-0000-4000-8000-000000000003', actorRole: 'RECRUITER', action: 'CREATE', createdAt: '2026-11-21T09:00:00Z' },
    ], totalElements: 2, totalPages: 1 } });
    throw new Error(`Unexpected request: ${path}`);
  });
}
afterEach(() => vi.restoreAllMocks());

describe('real admin dashboard', () => {
  it('uses backend counts and leaves unsupported counts absent', async () => {
    network();
    const response = await handleAdminDashboard(request('stats/overview'), base);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ availableMetrics: ['new_companies'], companies: { total: 50, pending: 3 },
      jobs: { byStatus: { open: 54 } }, reports: { open: 2 }, revenue: { total: 150000000 } });
  });
  it('derives the company series from real creation dates and applies the date filter', async () => {
    network();
    const response = await handleAdminDashboard(request('stats/timeseries?metric=new_companies&interval=day&from=2026-11-20&to=2026-11-20'), base);
    expect(await response.json()).toMatchObject({ points: [{ date: '2026-11-20', value: 2 }] });
  });
  it('shows only admin audit entries and enforces the admin role', async () => {
    network();
    const logs = await handleAdminDashboard(request('activity-logs'), base);
    expect((await logs.json()).items).toMatchObject([{ action: 'VERIFY', actorRole: 'admin' }]);
    const page = await handleAdminDashboard(request('activity-logs?role=admin&page=1&pageSize=100'), base);
    expect((await page.json()).meta).toMatchObject({ page: 1, pageSize: 100, totalPages: 1, totalItems: 2 });
    vi.restoreAllMocks();
    const fetch = network('RECRUITER');
    expect((await handleAdminDashboard(request('stats/overview'), base)).status).toBe(403);
    expect(fetch.mock.calls.filter(([url]) => String(url).startsWith(base))).toHaveLength(0);
  });
});
