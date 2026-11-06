import { z } from 'zod';
import { applicationResumeDownloadSchema, upstreamJobApplicantSchema } from '@/lib/api/job-applicant-schemas';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';
import { mapJobApplicant } from './job-applicant-mapper';
import { mockJobApplicationDetail } from './mock-job-applicants';
import { CV_MAX_SIZE } from '@/lib/api/cv-schemas';

export async function handleJobApplicationDetail(request: Request, id: string, resource: 'detail' | 'resume' | 'cv', baseUrl?: string): Promise<Response> {
    if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    if (!z.uuid().safeParse(id).success) return apiError(404, 'NOT_FOUND', 'Hồ sơ không hợp lệ.');
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
        if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
        if (!baseUrl) return mockJobApplicationDetail(identity.user, id, resource);
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/applications/${id}${resource === 'detail' ? '' : '/resume'}`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền xem hồ sơ này.');
        if (response.status === 404) return apiError(404, 'NOT_FOUND', 'Hồ sơ không tồn tại hoặc không thuộc công ty của bạn.');
        if (!response.ok) throw new Error('Application service unavailable');
        const { data } = z.object({ success: z.literal(true), data: z.unknown() }).parse(await response.json());
        if (resource !== 'detail') {
            const download = applicationResumeDownloadSchema.parse(data);
            if (!download.url.startsWith('https://')) throw new Error('Invalid upstream resume URL');
            if (Date.parse(download.expiresAt) <= Date.now()) throw new Error('Expired resume URL');
            if (resource === 'cv') {
                const url = new URL(download.url);
                if (!['api.cloudinary.com', 'res.cloudinary.com'].includes(url.hostname) || url.port) throw new Error('Untrusted CV host');
                // Do not forward the application bearer token to file storage.
                const file = await fetch(url, { headers: { Accept: 'application/pdf' }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30000) });
                if (!file.ok || Number(file.headers.get('content-length')) > CV_MAX_SIZE) throw new Error('CV unavailable');
                const bytes = new Uint8Array(await file.arrayBuffer());
                if (bytes.length > CV_MAX_SIZE || new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') return apiError(422, 'CV_INVALID_FORMAT', 'Tệp không phải PDF hợp lệ.');
                return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="candidate-cv.pdf"', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
            }
            return Response.json(download, { headers: { 'Cache-Control': 'private, no-store' } });
        }
        const item = upstreamJobApplicantSchema.parse(data);
        if (item.id !== id) throw new Error('Unexpected application');
        return Response.json(mapJobApplicant(item), { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải hồ sơ hoặc CV. Vui lòng thử lại.'); }
}
