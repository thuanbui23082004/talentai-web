import { z } from 'zod';
import { recruiterJobFiltersSchema } from '@/lib/jobs/recruiter-filters';
import { jobPostingInputSchema, jobPostingRecordSchema, postingCategorySchema, postingLocationSchema, postingSkillSchema } from '@/lib/api/job-posting-schemas';
import { hasValidCsrf, isTrustedOrigin } from '../auth/cookies';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';
import { mapRecruiterPosting } from './job-posting-mapper';
import { fromJobLocationIds, toJobLocationIds } from './job-location-ids';

const root = '/api/bff/recruiter/jobs';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
const unavailable = () => apiError(503, 'SERVICE_UNAVAILABLE', 'Không thể kết nối dịch vụ tin tuyển dụng. Vui lòng thử lại.');
const envelope = z.object({ data: z.unknown() });
const pageShape = { page: z.number().int().nonnegative(), size: z.number().int().positive(), totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() };

export function isRecruiterJobPostingRequest(request: Request) {
  const path = new URL(request.url).pathname;
  return path === root || path.startsWith(`${root}/`);
}

async function upstreamError(response: Response) {
  if (response.status === 403) {
    const body = z.object({ error: z.object({ code: z.string() }) }).safeParse(await response.json().catch(() => null));
    if (body.success && body.data.error.code === 'COMPANY_NOT_VERIFIED') {
      return apiError(403, 'COMPANY_NOT_VERIFIED', 'Doanh nghiệp chưa được xác thực. Vui lòng hoàn tất xác thực trước khi đăng tin.');
    }
  }
  const codes: Record<number, 'SESSION_EXPIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED'> = {
    401: 'SESSION_EXPIRED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 429: 'RATE_LIMITED',
  };
  if ([400, 422].includes(response.status)) return apiError(422, 'VALIDATION_FAILED', 'Thông tin tin tuyển dụng chưa hợp lệ.');
  const code = codes[response.status];
  return code ? apiError(response.status, code, 'Không thể thực hiện thao tác tin tuyển dụng.') : unavailable();
}

export async function handleRecruiterJobPostings(request: Request, baseUrl: string, companyApiUrl: string): Promise<Response> {
  const source = new URL(request.url);
  const suffix = source.pathname.slice(root.length);
  const match = /^\/([0-9a-f-]{36})(?:\/(publish|pause|reopen|close))?$/i.exec(suffix);
  if (suffix && suffix !== '/options' && !match) return apiError(404, 'NOT_FOUND', 'Không tìm thấy chức năng tin tuyển dụng.');
  const allowed = suffix === '/options' ? ['GET'] : match?.[2] ? ['POST'] : match ? ['GET', 'PUT', 'DELETE'] : ['GET', 'POST'];
  if (!allowed.includes(request.method)) return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
  if (request.method !== 'GET' && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, 'CSRF_TOKEN_INVALID', 'Phiên thao tác không hợp lệ.');

  try {
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
    const accessToken = identity.access;

    async function call(path: string, method = 'GET', body?: unknown, base = baseUrl) {
      // Retry reads only. Creating/updating a draft must never be replayed automatically.
      for (let attempt = 0; attempt < (method === 'GET' ? 3 : 1); attempt++) {
        try {
          const response = await fetch(`${base.replace(/\/$/, '')}/${path}`, {
            method, headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
          });
          if (response.status >= 500 && method === 'GET' && attempt < 2) { await new Promise(resolve => setTimeout(resolve, 1000)); continue; }
          if (!response.ok) throw await upstreamError(response);
          return response;
        } catch (error) {
          if (error instanceof Response) throw error;
          if (method !== 'GET' || attempt === 2) throw unavailable();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      throw unavailable();
    }
    const data = async (path: string) => envelope.parse(await (await call(path)).json()).data;
    const locations = async (parentId?: number) => z.array(postingLocationSchema).parse(await data(`job-locations${parentId ? `?parentId=${parentId}` : ''}`));
    async function currentCompany() {
      const response = await call('recruiter/company', 'GET', undefined, companyApiUrl);
      return z.object({ id: z.uuid(), name: z.string() }).parse(envelope.parse(await response.json()).data);
    }

    if (suffix === '/options') {
      const categories = z.array(postingCategorySchema).parse(await data('job-categories'));
      const first = z.object({ ...pageShape, items: z.array(postingSkillSchema) }).parse(await data('skills?page=0&size=100'));
      const skills = [...first.items];
      for (let page = 1; page < first.totalPages; page++) {
        const next = z.object({ ...pageShape, items: z.array(postingSkillSchema) }).parse(await data(`skills?page=${page}&size=100`));
        skills.push(...next.items);
      }
      return reply({ categories, skills, company: await currentCompany() });
    }

    let input: z.infer<typeof jobPostingInputSchema> | undefined;
    if (request.method === 'PUT' || (request.method === 'POST' && !match)) {
      if (!request.headers.get('content-type')?.includes('application/json')) return apiError(422, 'VALIDATION_FAILED', 'Vui lòng gửi dữ liệu JSON.');
      const text = await request.text();
      if (text.length > 256000) return apiError(413, 'PAYLOAD_TOO_LARGE', 'Nội dung tin quá dài.');
      let body: unknown;
      try { body = JSON.parse(text); } catch { return apiError(422, 'VALIDATION_FAILED', 'JSON không hợp lệ.'); }
      const parsed = jobPostingInputSchema.safeParse(body);
      if (!parsed.success || (request.method === 'PUT' && parsed.data.version === undefined)) return apiError(422, 'VALIDATION_FAILED', 'Thông tin tin tuyển dụng chưa hợp lệ.');
      input = parsed.data;
    }

    // Resolve company before a write: a failed auxiliary read must not turn a successful POST into a retryable error.
    const company = await currentCompany();
    const map = (value: unknown) => {
      const posting = jobPostingRecordSchema.parse(value);
      if (posting.companyId !== company.id) throw apiError(403, 'FORBIDDEN', 'Tin không thuộc doanh nghiệp của bạn.');
      return mapRecruiterPosting(posting, company);
    };

    if (request.method === 'GET') {
      if (match) {
        const job = map(await data(`recruiter/jobs/${match[1]}`));
        const location = job.posting?.locations?.[0];
        if (location && location.provinceId !== undefined && job.posting) {
          job.posting.workplace = fromJobLocationIds(location.provinceId, location.wardId);
          job.posting.addressLine = location.addressLine;
        }
        return reply(job);
      }
      const query = recruiterJobFiltersSchema.safeParse(Object.fromEntries(source.searchParams));
      if (!query.success) return apiError(422, 'VALIDATION_FAILED', 'Bộ lọc hoặc phân trang không hợp lệ.');
      const params = new URLSearchParams({ page: String(query.data.page - 1), size: String(query.data.pageSize), sort: 'createdAt,desc' });
      if (query.data.status) params.set('status', query.data.status);
      const page = z.object({ ...pageShape, items: z.array(z.unknown()) }).parse(await data(`recruiter/jobs?${params}`));
      return reply({ items: page.items.map(map), meta: { page: page.page + 1, pageSize: page.size, totalItems: page.totalElements, totalPages: page.totalPages } });
    }
    if (input) {
      const { workplace, addressLine, ...payload } = input;
      if (!match) delete payload.version;
      if (workplace) {
        const ids = toJobLocationIds(workplace);
        if (!ids) return apiError(422, 'VALIDATION_FAILED', 'Vui lòng chọn tỉnh/thành phố và phường/xã hợp lệ.');
        const province = (await locations()).find(item => item.type === 'PROVINCE' && item.id === ids.provinceId);
        if (!province) return apiError(422, 'VALIDATION_FAILED', 'Tỉnh/thành phố chưa có trong danh mục backend.');
        const ward = ids.wardId ? (await locations(ids.provinceId)).find(item => item.type === 'WARD' && item.id === ids.wardId && item.parentId === ids.provinceId) : undefined;
        if (ids.wardId && !ward) return apiError(422, 'VALIDATION_FAILED', 'Phường/xã không thuộc tỉnh/thành phố đã chọn.');
        payload.locations = [{ ...ids, addressLine }];
        payload.location = [addressLine, ward?.name, province.name].filter(Boolean).join(', ');
        if (payload.location.length > 500) return apiError(422, 'VALIDATION_FAILED', 'Địa chỉ tổng hợp tối đa 500 ký tự.');
      }
      const response = await call(match ? `recruiter/jobs/${match[1]}` : 'recruiter/jobs', request.method, payload);
      const job = map(envelope.parse(await response.json()).data);
      if (job.posting) { job.posting.workplace = workplace; job.posting.addressLine = addressLine; }
      return reply(job, match ? 200 : 201);
    }
    // Use the version shown to the user, so stale confirmation cannot overwrite a concurrent change.
    if (!match) return apiError(404, 'NOT_FOUND', 'Không tìm thấy tin tuyển dụng.');
    const version = z.coerce.number().int().nonnegative().safeParse(request.headers.get('If-Match'));
    if (!/^\d+$/.test(request.headers.get('If-Match') ?? '') || !version.success) return apiError(422, 'VALIDATION_FAILED', 'Vui lòng tải lại phiên bản tin mới nhất.');
    const action = match[2] === 'reopen' ? 'resume' : match[2];
    const target = request.method === 'DELETE' ? `recruiter/jobs/${match[1]}?version=${version.data}` : `recruiter/jobs/${match[1]}/${action}`;
    const response = await call(target, request.method, request.method === 'POST' ? { version: version.data } : undefined);
    return request.method === 'DELETE' ? new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } }) : reply(map(envelope.parse(await response.json()).data));
  } catch (error) {
    if (error instanceof Response) return error;
    return unavailable();
  }
}
