import { z } from 'zod';
import { readRequestIdentity } from '@/server/bff/auth/session';
import { apiError } from '@/server/bff/responses';

const basePath = '/api/bff/admin/';
const paths = new Set(['stats/overview', 'stats/timeseries', 'activity-logs']);
const nonnegative = z.number().int().nonnegative();
const companyPage = z.object({ data: z.object({
  content: z.array(z.object({ createdAt: z.string() })), totalElements: nonnegative, totalPages: nonnegative,
}) });
const reportPage = z.object({ code: z.number(), data: z.object({ totalElements: nonnegative }) });
const jobPage = z.object({ data: z.object({ totalElements: nonnegative }) });
const paymentStats = z.object({ totalRevenue: z.number().nonnegative() });
const auditPage = z.object({ code: z.number(), data: z.object({
  content: z.array(z.object({ id: z.uuid(), actorRole: z.string().nullish(), action: z.string(),
    description: z.string().nullish(), createdAt: z.string() })), totalElements: nonnegative, totalPages: nonnegative,
}) });
const date = z.iso.date();

export function isAdminDashboardRequest(request: Request) {
  return paths.has(new URL(request.url).pathname.slice(basePath.length)) && new URL(request.url).pathname.startsWith(basePath);
}

export async function handleAdminDashboard(request: Request, baseUrl: string): Promise<Response> {
  if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
  const source = new URL(request.url);
  const route = source.pathname.slice(basePath.length);
  const from = source.searchParams.get('from');
  const to = source.searchParams.get('to');
  if ((from && !date.safeParse(from).success) || (to && !date.safeParse(to).success) || (from && to && from > to))
    return apiError(422, 'VALIDATION_FAILED', 'Khoảng ngày không hợp lệ.');
  try {
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (identity.user.role !== 'admin') return apiError(403, 'FORBIDDEN', 'Chỉ quản trị viên được xem thống kê.');
    const access = identity.access;
    async function read<T>(path: string, schema: z.ZodType<T>): Promise<T> {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/${path}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${access}` },
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw apiError(response.status === 401 ? 401 : response.status === 403 ? 403 : 503,
        'SERVICE_UNAVAILABLE', 'Không thể tải số liệu quản trị.');
      return schema.parse(await response.json());
    }
    async function companies(path = 'admin/companies?page=0&size=100') { return (await read(path, companyPage)).data; }
    if (route === 'stats/overview') {
      const [pending, totalCompanies, reports, jobs, revenue] = await Promise.all([
        companies('admin/companies?verificationStatus=PENDING&page=0&size=1'),
        companies('admin/companies?page=0&size=1'),
        read('admin/reports?status=PENDING&page=0&size=1', reportPage),
        read('jobs?sort=publishedAt,desc&page=0&size=1', jobPage),
        read('admin/orders/statistics', paymentStats).catch(() => null),
      ]);
      return Response.json({ availableMetrics: ['new_companies'], companies: { total: totalCompanies.totalElements, pending: pending.totalElements },
        jobs: { byStatus: { open: jobs.data.totalElements } }, reports: { open: reports.data.totalElements },
        ...(revenue ? { revenue: { total: revenue.totalRevenue } } : {}) },
      { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (route === 'stats/timeseries') {
      if (source.searchParams.get('metric') !== 'new_companies' || ![null, 'day'].includes(source.searchParams.get('interval')))
        return apiError(422, 'VALIDATION_FAILED', 'Chỉ số thống kê không được hỗ trợ.');
      const counts = new Map<string, number>();
      for (let page = 0; page < 100; page++) {
        const result = await companies(`admin/companies?page=${page}&size=100`);
        for (const item of result.content) {
          const day = item.createdAt.slice(0, 10);
          if (date.safeParse(day).success && (!from || day >= from) && (!to || day <= to)) counts.set(day, (counts.get(day) ?? 0) + 1);
        }
        if (page + 1 >= result.totalPages) break;
      }
      return Response.json({ metric: 'new_companies', interval: 'day', points: [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([day, value]) => ({ date: day, value })) },
        { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (route === 'activity-logs') {
      const requestedPage = Number(source.searchParams.get('page') ?? 1);
      const pageSize = Number(source.searchParams.get('pageSize') ?? 20);
      if (!Number.isInteger(requestedPage) || requestedPage < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
        return apiError(422, 'VALIDATION_FAILED', 'Trang nhật ký không hợp lệ.');
      const items: Array<{ id: string; actorRole: 'admin'; action: string; description?: string; occurredAt: string; result: 'success' }> = [];
      const dashboard = pageSize === 5 && !source.searchParams.has('role');
      const startPage = dashboard ? 0 : requestedPage - 1;
      const endPage = dashboard ? 100 : requestedPage;
      let totalPages = 0, totalItems = 0;
      for (let page = startPage; page < endPage && items.length < (dashboard ? 5 : pageSize); page++) {
        const result = (await read(`admin/audit-logs?page=${page}&size=${dashboard ? 20 : pageSize}`, auditPage)).data;
        totalPages = result.totalPages; totalItems = result.totalElements;
        for (const log of result.content) {
          if (log.actorRole?.toUpperCase() !== 'ADMIN') continue;
          const day = log.createdAt.slice(0, 10);
          if ((from && day < from) || (to && day > to)) continue;
          items.push({ id: log.id, actorRole: 'admin', action: log.action, description: log.description ?? undefined,
            occurredAt: log.createdAt, result: 'success' });
          if (items.length === (dashboard ? 5 : pageSize)) break;
        }
        if (page + 1 >= result.totalPages) break;
      }
      return Response.json({ items, meta: { page: requestedPage, pageSize, totalPages, totalItems } },
        { headers: { 'Cache-Control': 'private, no-store' } });
    }
    return apiError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
  } catch (failure) {
    return failure instanceof Response ? failure : apiError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải số liệu quản trị. Vui lòng thử lại.');
  }
}
