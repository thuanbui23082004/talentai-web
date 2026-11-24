import { z } from 'zod';
import { catalogInputSchema, catalogItemSchema, catalogPageSchema } from '@/features/admin/schemas/content';
import { hasValidCsrf, isTrustedOrigin } from '@/server/bff/auth/cookies';
import { readRequestIdentity } from '@/server/bff/auth/session';
import { apiError } from '@/server/bff/responses';

const numericId = z.number().int().positive();
const upstreamItem = z.object({
  categoryId: numericId,
  categoryName: z.string(),
  description: z.string().nullish(),
  industryId: numericId.nullish(),
  industryName: z.string().nullish(),
  isActive: z.boolean().nullish(),
});
const upstreamPage = z.object({
  data: z.object({ items: z.array(upstreamItem), page: z.number().int(), size: z.number().int(), totalElements: z.number().int(), totalPages: z.number().int() }),
});
const upstreamSingle = z.object({ data: upstreamItem });
const upstreamIndustries = z.object({ data: z.array(z.object({ id: numericId, name: z.string() })) });
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

function upstreamError(status: number) {
  const code = status === 400 || status === 422 ? 'VALIDATION_FAILED' : status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : 'SERVICE_UNAVAILABLE';
  return apiError(code === 'SERVICE_UNAVAILABLE' ? 503 : status === 400 ? 422 : status, code, 'Không thể thực hiện yêu cầu. Vui lòng thử lại.');
}
function mapItem(raw: z.infer<typeof upstreamItem>) {
  return catalogItemSchema.parse({ id: String(raw.categoryId), type: 'positions', name: raw.categoryName, description: raw.description ?? undefined, industryId: raw.industryId == null ? undefined : String(raw.industryId), industryName: raw.industryName ?? undefined, isActive: raw.isActive ?? true });
}

export function isAdminJobCategoriesRequest(request: Request) {
  return /^\/api\/bff\/admin\/catalog\/(?:positions(?:\/[^/]+)?|industries)$/.test(new URL(request.url).pathname);
}

export async function handleAdminJobCategories(request: Request, baseUrl: string): Promise<Response> {
  const source = new URL(request.url);
  const industryList = source.pathname.endsWith('/industries');
  const itemId = source.pathname.match(/\/positions\/([^/]+)$/)?.[1];
  if (!(['GET', 'POST'].includes(request.method) && !itemId || ['GET', 'PUT', 'DELETE'].includes(request.method) && !!itemId) || (industryList && request.method !== 'GET'))
    return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
  if (request.method !== 'GET' && (!isTrustedOrigin(request) || !hasValidCsrf(request)))
    return apiError(403, 'CSRF_TOKEN_INVALID', 'Phiên thao tác không hợp lệ.');
  try {
    const identity = await readRequestIdentity(request);
    if (!identity) return upstreamError(401);
    if (identity.user.role !== 'admin') return upstreamError(403);
    const root = baseUrl.replace(/\/$/, '');
    const call = (path: string, method = 'GET', body?: unknown) => fetch(`${root}/${path}`, {
      method, headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    if (industryList) {
      const upstream = await call('industries');
      if (!upstream.ok) return upstreamError(upstream.status);
      const rows = upstreamIndustries.parse(await upstream.json()).data.map(row => catalogItemSchema.parse({ id: String(row.id), type: 'industries', name: row.name, isActive: true }));
      const page = Number(source.searchParams.get('page') ?? 1), pageSize = Number(source.searchParams.get('pageSize') ?? 20);
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return upstreamError(422);
      return reply(catalogPageSchema.parse({ items: rows.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: rows.length, totalPages: Math.ceil(rows.length / pageSize) } }));
    }
    if (itemId && !/^[1-9]\d*$/.test(itemId)) return upstreamError(422);
    if (request.method === 'GET' && !itemId) {
      const page = Number(source.searchParams.get('page') ?? 1), pageSize = Number(source.searchParams.get('pageSize') ?? 20);
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return upstreamError(422);
      const query = new URLSearchParams({ page: String(page - 1), size: String(pageSize) });
      for (const key of ['q', 'industryId', 'isActive']) {
        const value = source.searchParams.get(key);
        if (value) query.set(key, value);
      }
      const upstream = await call(`admin/job-categories?${query}`);
      if (!upstream.ok) return upstreamError(upstream.status);
      const data = upstreamPage.parse(await upstream.json()).data;
      return reply(catalogPageSchema.parse({ items: data.items.map(mapItem), meta: { page: data.page + 1, pageSize: data.size, totalItems: data.totalElements, totalPages: data.totalPages } }));
    }
    const path = `admin/job-categories${itemId ? `/${itemId}` : ''}`;
    if (request.method === 'DELETE') {
      const upstream = await call(path, 'DELETE');
      return upstream.ok ? new Response(null, { status: 204 }) : upstreamError(upstream.status);
    }
    const parsed = catalogInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || parsed.data.name.length > 100 || (parsed.data.industryId && !/^[1-9]\d*$/.test(parsed.data.industryId))) return upstreamError(422);
    const value = parsed.data;
    const upstream = await call(path, request.method, { categoryName: value.name, description: value.description ?? '', industryId: value.industryId ? Number(value.industryId) : null, isActive: value.isActive });
    if (!upstream.ok) return upstreamError(upstream.status);
    return reply(mapItem(upstreamSingle.parse(await upstream.json()).data), request.method === 'POST' ? 201 : 200);
  } catch {
    return apiError(503, 'SERVICE_UNAVAILABLE', 'Không thể kết nối dịch vụ danh mục. Vui lòng thử lại.');
  }
}
