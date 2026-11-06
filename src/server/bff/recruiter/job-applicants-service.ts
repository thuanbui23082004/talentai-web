import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { jobApplicantQuerySchema, upstreamJobApplicantPageSchema } from '@/lib/api/job-applicant-schemas';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';
import { mockJobApplicants } from './mock-job-applicants';
import { mapJobApplicant } from './job-applicant-mapper';

export async function handleJobApplicants(request: Request, jobId: string, baseUrl?: string): Promise<Response> {
    if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    const query = jobApplicantQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!z.uuid().safeParse(jobId).success || !query.success) return apiError(422, 'VALIDATION_FAILED', 'Bộ lọc không hợp lệ.');
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
        if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
        if (!baseUrl) return mockJobApplicants(identity.user, jobId, query.data, request.headers.get('x-mock-scenario'));
        const params = new URLSearchParams({ page: String(query.data.page - 1), size: String(query.data.pageSize) });
        if (query.data.status) params.set('status', query.data.status);
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/recruiter/jobs/${jobId}/applications?${params}`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền xem ứng viên của tin này.');
        if (response.status === 404) return apiError(404, 'NOT_FOUND', 'Tin không tồn tại hoặc không thuộc công ty của bạn.');
        if (response.status === 400) return apiError(422, 'VALIDATION_FAILED', 'Bộ lọc không hợp lệ.');
        if (!response.ok) throw new Error('Application service unavailable');
        const { data } = upstreamJobApplicantPageSchema.parse(await response.json());
        if (data.items.some(item => item.jobId !== jobId)) throw new Error('Unexpected job in application response');
        const result: components['schemas']['JobApplicantPage'] = {
            items: data.items.map(mapJobApplicant),
            meta: { page: data.page + 1, pageSize: data.size, totalItems: data.totalElements, totalPages: data.totalPages },
        };
        return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải danh sách ứng viên. Vui lòng thử lại.'); }
}
