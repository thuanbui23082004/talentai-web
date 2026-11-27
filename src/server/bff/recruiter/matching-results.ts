import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { hasValidCsrf, isTrustedOrigin } from '../auth/cookies';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';

const identifier = z.uuid();
const score = z.number().min(0).max(100);
const fieldScore = z.object({
  score, status: z.string(), evidence: z.string(), requirement: z.string(), reason: z.string(), model: z.string(),
});
const details = z.object({
  score, semantic_score: score, skill_score: score,
  matched_skills: z.array(z.string()), missing_skills: z.array(z.string()),
  explanation: z.string(), field_scores: z.record(z.string(), fieldScore),
});
const result = z.object({
  applicationId: identifier, jobId: identifier, status: z.enum(['SCORED', 'NOT_SCORED']),
  score: score.nullable(), details: details.nullable(), scoredAt: z.iso.datetime({ offset: true }).nullable(),
}).superRefine((value, context) => {
  if (value.status === 'SCORED' && (value.score === null || value.details === null || value.scoredAt === null))
    context.addIssue({ code: 'custom', message: 'Scored result is incomplete' });
  if (value.status === 'NOT_SCORED' && (value.score !== null || value.details !== null || value.scoredAt !== null))
    context.addIssue({ code: 'custom', message: 'Unscored result has a score' });
});
const batchRequest = z.object({ jobId: identifier, applicationIds: z.array(identifier).min(1).max(100) }).strict()
  .refine(value => new Set(value.applicationIds).size === value.applicationIds.length);
const ranking = z.object({ jobId: identifier, page: z.number().int().nonnegative(), size: z.number().int().positive(), total: z.number().int().nonnegative(), items: z.array(z.object({ rank: z.number().int().positive(), applicationId: identifier, score, scoredAt: z.iso.datetime({ offset: true }) })) });

export function isRecruiterMatchingRequest(request: Request) {
  return /^\/api\/bff\/matching\/(applications\/|jobs\/)/.test(new URL(request.url).pathname);
}

export async function handleRecruiterMatching(request: Request, gatewayUrl: string): Promise<Response> {
  const url = new URL(request.url);
  const pathApplicationId = /^\/api\/bff\/matching\/applications\/([^/]+)$/.exec(url.pathname)?.[1];
  const applicationId = pathApplicationId === 'results:batch' ? undefined : pathApplicationId;
  const jobId = /^\/api\/bff\/matching\/jobs\/([^/]+)\/rankings$/.exec(url.pathname)?.[1];
  const batch = url.pathname === '/api/bff/matching/applications/results:batch';
  if (!(applicationId && request.method === 'GET') && !(jobId && request.method === 'GET') && !(batch && request.method === 'POST'))
    return apiError(405, 'BAD_REQUEST', 'Đường dẫn hoặc phương thức không được hỗ trợ.');
  if ((applicationId && !identifier.safeParse(applicationId).success) || (jobId && !identifier.safeParse(jobId).success))
    return apiError(422, 'VALIDATION_FAILED', 'Mã hồ sơ hoặc tin tuyển dụng không hợp lệ.');
  const query = jobId ? z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), size: z.coerce.number().int().min(1).max(100).default(20) }).strict().safeParse(Object.fromEntries(url.searchParams)) : null;
  if (query && !query.success) return apiError(422, 'VALIDATION_FAILED', 'Trang xếp hạng không hợp lệ.');
  if (!jobId && url.search) return apiError(422, 'VALIDATION_FAILED', 'Yêu cầu không hợp lệ.');
  if (batch && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, 'CSRF_TOKEN_INVALID', 'Phiên thao tác không hợp lệ.');
  try {
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chỉ nhà tuyển dụng được xem kết quả này.');
    const body = batch ? batchRequest.safeParse(await request.json()) : null;
    if (body && !body.success) return apiError(422, 'VALIDATION_FAILED', 'Danh sách hồ sơ không hợp lệ.');
    const target = new URL(`${gatewayUrl.replace(/\/$/, '')}${url.pathname.slice('/api/bff'.length)}`);
    if (query?.success) {
      target.searchParams.set('page', String(query.data.page));
      target.searchParams.set('size', String(query.data.size));
    }
    const response = await fetch(target, {
      method: request.method,
      headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body?.success ? { body: JSON.stringify(body.data) } : {}),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
    if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền xem kết quả của hồ sơ hoặc tin này.');
    if (response.status === 404) return apiError(503, 'SERVICE_UNAVAILABLE', 'API kết quả AI chưa sẵn sàng. Vui lòng thử lại sau.');
    if (!response.ok) return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải kết quả AI. Vui lòng thử lại.');
    const payload: unknown = await response.json();
    const headers = { 'Cache-Control': 'private, no-store' };
    if (batch && body?.success) {
      const values = z.array(result).parse(payload);
      if (values.length !== body.data.applicationIds.length || values.some((item, index) => item.applicationId !== body.data.applicationIds[index] || item.jobId !== body.data.jobId)) throw new Error('Unexpected batch results');
      return Response.json(values satisfies components['schemas']['RecruiterMatchResult'][], { headers });
    }
    if (applicationId) {
      const value = result.parse(payload);
      if (value.applicationId !== applicationId) throw new Error('Unexpected application result');
      return Response.json(value satisfies components['schemas']['RecruiterMatchResult'], { headers });
    }
    const value = ranking.parse(payload);
    if (value.jobId !== jobId || value.page !== query?.data.page) throw new Error('Unexpected ranking results');
    return Response.json(value satisfies components['schemas']['RecruiterMatchRankingPage'], { headers });
  } catch {
    return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải kết quả AI. Vui lòng thử lại.');
  }
}
