import { z } from 'zod';
import { jobApplicantStatusUpdateSchema, upstreamJobApplicantSchema } from '@/lib/api/job-applicant-schemas';
import { hasValidCsrf, isTrustedOrigin } from '../auth/cookies';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';
import { mapJobApplicant } from './job-applicant-mapper';
import { updateMockJobApplicantStatus } from './mock-job-applicants';

export async function handleJobApplicantStatus(request: Request, id: string, baseUrl?: string): Promise<Response> {
    if (request.method !== 'PATCH') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    if (!isTrustedOrigin(request) || !hasValidCsrf(request)) return apiError(403, 'CSRF_TOKEN_INVALID', 'Phiên thao tác không hợp lệ.');
    if (!z.uuid().safeParse(id).success) return apiError(404, 'NOT_FOUND', 'Hồ sơ không hợp lệ.');
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
        if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
        const parsed = jobApplicantStatusUpdateSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return apiError(422, 'VALIDATION_FAILED', 'Trạng thái hoặc phiên bản hồ sơ không hợp lệ.');
        if (!baseUrl) return await updateMockJobApplicantStatus(identity.user, id, parsed.data);
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/applications/${id}/status`, {
            method: 'PATCH', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${identity.access}` },
            body: JSON.stringify(parsed.data), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền cập nhật hồ sơ này.');
        if (response.status === 404) return apiError(404, 'NOT_FOUND', 'Hồ sơ không tồn tại hoặc không thuộc công ty của bạn.');
        if (response.status === 409) return apiError(409, 'CONFLICT', 'Hồ sơ đã thay đổi hoặc không thể chuyển sang bước này. Vui lòng tải lại.');
        if ([400, 422].includes(response.status)) return apiError(422, 'VALIDATION_FAILED', 'Trạng thái hoặc phiên bản hồ sơ không hợp lệ.');
        if (!response.ok) throw new Error('Application service unavailable');
        const { data } = z.object({ success: z.literal(true), data: upstreamJobApplicantSchema }).parse(await response.json());
        if (data.id !== id || data.status !== parsed.data.status || data.version <= parsed.data.version) throw new Error('Unexpected application update');
        return Response.json(mapJobApplicant(data), { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa xác nhận được cập nhật. Vui lòng tải lại bảng để kiểm tra trạng thái.'); }
}
