import { handleAdminMonitoring } from '@/server/bff/admin-monitoring-handler';
import { handleAdminStatistics } from '@/server/bff/admin-statistics-handler';
import { handleAdminCatalog } from '@/server/bff/admin-catalog-handler';
import { handleAdminReports, reportOverview } from '@/server/bff/admin-reports-handler';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema, periodSchema } from '@/features/admin';
import { mockAdmin, mockAdminPassword, adminOverview, adminDailyActivity } from '@/mocks/fixtures/admin';
import { handleAdminUsers } from '@/server/bff/admin-users-handler';
import { handleAdminActivity } from '@/server/bff/admin-activity-handler';
import { handleAdminCompanies } from '@/server/bff/admin-companies-handler';
import { companyOverview } from '@/server/bff/admin-companies-store';
import { handleAdminJobs } from '@/server/bff/admin-jobs-handler';
import { adminJobOverview } from '@/server/bff/admin-jobs-store';
import { ADMIN_MOCK_COOKIE, getRecruiterMockStore, type MockSession } from '@/server/bff/recruiter/mock-store';

const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
export async function handleAdminRequest(request: NextRequest, path: string, session?: MockSession) {
  const store = getRecruiterMockStore();
  if (path === 'auth/login' && request.method === 'POST') {
    const input = loginSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return problem(422, 'VALIDATION_FAILED');
    if (input.data.email !== mockAdmin.email || input.data.password !== mockAdminPassword) return problem(401, 'INVALID_CREDENTIALS');
    const id = randomUUID();
    const csrf = randomUUID();
    const expiresAt = Date.now() + 1800000;
    const old = request.cookies.get(ADMIN_MOCK_COOKIE)?.value;
    if (old) store.sessions.delete(old);
    store.sessions.set(id, { role: 'admin', userId: mockAdmin.id, csrf, expiresAt });
    const result = response({ user: mockAdmin, csrfToken: csrf, expiresAt: new Date(expiresAt).toISOString(), idleTimeoutSeconds: 1800, redirectTo: '/admin/dashboard' });
    result.cookies.set(ADMIN_MOCK_COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 1800 });
    return result;
  }
  if (path === 'auth/logout' && request.method === 'POST') {
    if (!session) return problem(401, 'UNAUTHENTICATED');
    if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
    const cookie = session.role === 'admin' ? ADMIN_MOCK_COOKIE : 'talentai_mock_session';
    store.sessions.delete(request.cookies.get(cookie)?.value ?? '');
    const result = new NextResponse(null, { status: 204 }); result.cookies.delete(cookie); return result;
  }
  if (path === 'me' && request.method === 'GET' && session?.role === 'admin' && request.headers.get('X-TalentAI-Workspace') === 'admin') return response(mockAdmin);
  if (!path.startsWith('admin/')) return;
  if (!session) return problem(401, 'UNAUTHENTICATED');
  if (session.role !== 'admin') return problem(403, 'FORBIDDEN');
  const statisticsResponse = handleAdminStatistics(request, path);
  if (statisticsResponse) return statisticsResponse;
  const monitoringResponse = await handleAdminMonitoring(request, path, session);
  if (monitoringResponse) return monitoringResponse;
  const catalogResponse = await handleAdminCatalog(request, path, session);
  if (catalogResponse) return catalogResponse;
  const reportsResponse = await handleAdminReports(request, path, session);
  if (reportsResponse) return reportsResponse;
  const usersResponse = await handleAdminUsers(request, path, session);
  if (usersResponse) return usersResponse;
  const companiesResponse = await handleAdminCompanies(request, path, session);
  if (companiesResponse) return companiesResponse;
  const jobsResponse = await handleAdminJobs(request, path, session);
  if (jobsResponse) return jobsResponse;
  if (path === 'admin/activity-logs') return handleAdminActivity(request);
  if (request.method !== 'GET') return problem(405, 'METHOD_NOT_ALLOWED');
  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = periodSchema.safeParse({ from: raw.from?.slice(0, 10), to: raw.to?.slice(0, 10) });
  if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
  const { from, to } = parsed.data;
  const within = (date: string) => (!from || date.slice(0, 10) >= from) && (!to || date.slice(0, 10) <= to);
  const empty = request.headers.get('x-mock-scenario') === 'empty';
  const rows = empty ? [] : adminDailyActivity.filter(item => within(item.date));
  if (path === 'admin/stats/overview') {
    if (!from && !to && !empty) return response({ ...adminOverview, companies: companyOverview(), jobs: adminJobOverview(), reports: reportOverview() });
    const candidates = rows.reduce((n, item) => n + item.candidates, 0), recruiters = rows.reduce((n, item) => n + item.recruiters, 0);
    const jobSnapshot = adminJobOverview();
    return response({ users: { candidates, recruiters, total: candidates + recruiters }, companies: { pending: rows.length ? companyOverview().pending : 0 }, jobs: { total: rows.reduce((n, item) => n + item.jobs, 0), byStatus: rows.length ? jobSnapshot.byStatus : Object.fromEntries(Object.keys(jobSnapshot.byStatus).map(status => [status, 0])) }, reports: rows.length ? reportOverview() : { open: 0, inReview: 0 } });
  }
  return problem(404, 'NOT_FOUND');
}
