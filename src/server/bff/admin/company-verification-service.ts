import { z } from 'zod';
import { hasValidCsrf, isTrustedOrigin } from '@/server/bff/auth/cookies';
import { readRequestIdentity } from '@/server/bff/auth/session';
import { apiError } from '@/server/bff/responses';

const id = z.uuid();
const company = z.object({
  id, name: z.string(), verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']),
  createdAt: z.string(), updatedAt: z.string().nullish(), taxCode: z.string().nullish(),
  description: z.string().nullish(), address: z.string().nullish(), contactEmail: z.string().nullish(),
  contactPhone: z.string().nullish(), website: z.string().nullish(), companySize: z.number().nullish(),
  location: z.object({ id: z.number(), name: z.string() }).nullish(),
  industry: z.object({ id: z.number(), name: z.string() }).nullish(),
});
const page = z.object({ data: z.object({ content: z.array(company), page: z.number().int(), size: z.number().int(), totalElements: z.number().int(), totalPages: z.number().int() }) });
const document = z.object({
  id, companyId: id, documentType: z.string(), fileName: z.string(), fileUrl: z.string().url().nullish(),
  fileSize: z.number().int().nonnegative(), mimeType: z.string(), status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  rejectionReason: z.string().nullish(), uploadedAt: z.string().nullish(), verifiedAt: z.string().nullish(),
});
const documents = z.object({ data: z.array(document) });
const taxInfo = z.object({ data: z.object({ taxCode: z.string(), name: z.string(), address: z.string().nullish(), status: z.string().nullish(), isActive: z.boolean().nullish(), representative: z.string().nullish(), foundedDate: z.string().nullish(), taxDepartment: z.string().nullish() }) });
const uuidPath = /^\/api\/bff\/admin\/companies(?:\/([\w-]+)(?:\/(verify|reject|suspend|restore|tax-lookup|documents)(?:\/([\w-]+)(?:\/verification)?)?)?)?$/;
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
const error = (status: number) => apiError(status === 400 ? 422 : [401, 403, 404, 409, 422].includes(status) ? status : 503,
  status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : [400, 422].includes(status) ? 'VALIDATION_FAILED' : 'SERVICE_UNAVAILABLE',
  'Không thể xử lý hồ sơ doanh nghiệp. Vui lòng thử lại.');

function mapCompany(raw: z.infer<typeof company>, files?: z.infer<typeof document>[]) {
  return {
    id: raw.id, name: raw.name, verificationStatus: raw.verificationStatus.toLowerCase(), createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? undefined, taxCode: raw.taxCode ?? undefined, description: raw.description ?? undefined,
    address: raw.address ?? undefined, city: raw.location?.name, contactEmail: raw.contactEmail ?? undefined,
    contactPhone: raw.contactPhone ?? undefined, website: raw.website ?? undefined,
    size: raw.companySize ? String(raw.companySize) : undefined,
    industries: raw.industry ? [{ id: String(raw.industry.id), name: raw.industry.name }] : undefined,
    availableActions: raw.verificationStatus === 'PENDING' ? ['verify', 'reject'] : [],
    supportsModerationNotes: false,
    verificationDocuments: files?.map(file => ({ id: file.id, fileName: file.fileName, documentType: file.documentType,
      mimeType: file.mimeType, sizeBytes: file.fileSize, status: file.status.toLowerCase(),
      rejectionReason: file.rejectionReason ?? undefined, uploadedAt: file.uploadedAt ?? undefined, verifiedAt: file.verifiedAt ?? undefined })),
  };
}

export function isAdminCompanyVerificationRequest(request: Request) { return uuidPath.test(new URL(request.url).pathname); }

export async function handleAdminCompanyVerification(request: Request, baseUrl: string): Promise<Response> {
  const source = new URL(request.url), match = uuidPath.exec(source.pathname);
  if (!match) return error(404);
  const [, companyId, action, documentId] = match;
  if (companyId && !id.safeParse(companyId).success || documentId && !id.safeParse(documentId).success) return error(404);
  if (request.method !== 'GET' && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, 'CSRF_TOKEN_INVALID', 'Phiên thao tác không hợp lệ.');
  try {
    const identity = await readRequestIdentity(request);
    if (!identity) return error(401);
    if (identity.user.role !== 'admin') return error(403);
    const call = (path: string, method = 'GET', body?: unknown) => fetch(`${baseUrl.replace(/\/$/, '')}/${path}`, {
      method, headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    async function list(pageNumber: number, size: number) {
      const upstream = await call(`admin/companies?page=${pageNumber}&size=${size}`);
      if (!upstream.ok) throw error(upstream.status);
      return page.parse(await upstream.json()).data;
    }
    async function findCompany(target: string) {
      for (let index = 0; index < 100; index++) {
        const result = await list(index, 100);
        const found = result.content.find(item => item.id === target);
        if (found) return found;
        if (index + 1 >= result.totalPages) break;
      }
      throw error(404);
    }
    async function getDocuments(target: string) {
      const upstream = await call(`admin/companies/${target}/documents`);
      if (!upstream.ok) throw error(upstream.status);
      return documents.parse(await upstream.json()).data.filter(file => file.companyId === target);
    }
    if (request.method === 'GET' && !companyId) {
      const requested = Number(source.searchParams.get('page') ?? 1), size = Number(source.searchParams.get('pageSize') ?? 20);
      if (!Number.isInteger(requested) || requested < 1 || !Number.isInteger(size) || size < 1 || size > 100) return error(422);
      const result = await list(requested - 1, size);
      return reply({ items: result.content.map(item => mapCompany(item)), meta: { page: result.page + 1, pageSize: result.size, totalItems: result.totalElements, totalPages: result.totalPages } });
    }
    if (!companyId) return error(404);
    if (request.method === 'GET' && !action) return reply(mapCompany(await findCompany(companyId), await getDocuments(companyId)));
    if (request.method === 'GET' && action === 'tax-lookup') {
      const found = await findCompany(companyId);
      if (!found.taxCode || !/^\d{10}(?:-?\d{3})?$/.test(found.taxCode)) return error(422);
      const upstream = await call(`tax-lookup/${encodeURIComponent(found.taxCode)}`);
      if (!upstream.ok) return error(upstream.status);
      return reply(taxInfo.parse(await upstream.json()).data);
    }
    if (request.method === 'GET' && action === 'documents' && documentId) {
      const file = (await getDocuments(companyId)).find(item => item.id === documentId);
      if (!file?.fileUrl) return error(404);
      const url = new URL(file.fileUrl);
      if (url.protocol !== 'https:' || !(url.hostname === 'res.cloudinary.com' || url.hostname.endsWith('.cloudinary.com'))) return error(503);
      const upstream = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (!upstream.ok) return error(upstream.status);
      const contentType = upstream.headers.get('content-type')?.split(';')[0];
      if (!['application/pdf', 'image/png', 'image/jpeg'].includes(contentType ?? '')) return error(503);
      const bytes = await upstream.arrayBuffer();
      if (bytes.byteLength > 10 * 1024 * 1024) return error(503);
      return new Response(bytes, { headers: { 'Content-Type': contentType!, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (request.method === 'PATCH' && action === 'documents' && documentId && source.pathname.endsWith('/verification')) {
      const file = (await getDocuments(companyId)).find(item => item.id === documentId);
      if (!file) return error(404);
      const parsed = z.object({ status: z.enum(['verified', 'rejected']), rejectionReason: z.string().trim().max(1000).optional() }).safeParse(await request.json().catch(() => null));
      if (!parsed.success || parsed.data.status === 'rejected' && !parsed.data.rejectionReason) return error(422);
      const upstream = await call(`admin/documents/${documentId}/verification`, 'PATCH', { status: parsed.data.status.toUpperCase(), rejectionReason: parsed.data.rejectionReason });
      if (!upstream.ok) return error(upstream.status);
      return reply(mapCompany(await findCompany(companyId), await getDocuments(companyId)));
    }
    if (request.method === 'POST' && (action === 'verify' || action === 'reject')) {
      const found = await findCompany(companyId);
      if (found.verificationStatus !== 'PENDING') return error(422);
      const files = await getDocuments(companyId);
      if (action === 'verify' && (!files.some(file => file.status === 'VERIFIED') || files.some(file => file.status === 'PENDING'))) return error(422);
      if (action === 'verify') {
        if (!found.taxCode) return error(422);
        const lookup = await call(`tax-lookup/${encodeURIComponent(found.taxCode)}`);
        if (!lookup.ok) return error(lookup.status);
        const tax = taxInfo.parse(await lookup.json()).data;
        if (tax.taxCode.replace(/\D/g, '') !== found.taxCode.replace(/\D/g, '') || tax.isActive !== true) return error(422);
      }
      const upstream = await call(`admin/companies/${companyId}/verification`, 'PATCH', { status: action === 'verify' ? 'VERIFIED' : 'REJECTED' });
      if (!upstream.ok) return error(upstream.status);
      return reply(mapCompany(company.parse(z.object({ data: company }).parse(await upstream.json()).data), await getDocuments(companyId)));
    }
    return apiError(405, 'BAD_REQUEST', 'Thao tác không được hỗ trợ.');
  } catch (failure) {
    return failure instanceof Response ? failure : error(503);
  }
}
