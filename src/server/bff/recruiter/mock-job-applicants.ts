import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { jobApplicantQuerySchema } from '@/lib/api/job-applicant-schemas';
import { getRecruiterApplicationStore } from './application-store';
import { getRecruiterMockStore } from './mock-store';
import { getMockAccounts } from './account-company-handler';
import { apiError } from '../responses';
import { createSyntheticCvPdf } from './cv-document';
import { JOB_APPLICANT_TRANSITIONS } from '@/lib/api/job-applicant-transitions';

type Applicant = components['schemas']['JobApplicant'];
const mockState = globalThis as typeof globalThis & { jobApplicantUpdates?: Map<string, Pick<Applicant, 'status' | 'version'>> };
const updates = mockState.jobApplicantUpdates ??= new Map();

export function mockJobApplicants(user: components['schemas']['User'], jobId: string, query: z.infer<typeof jobApplicantQuerySchema>, scenario?: string | null) {
    const store = getRecruiterMockStore();
    const companyId = store.workspaces.get(user.id)?.companyId ?? user.companyId ?? getMockAccounts().get(user.id)?.user.companyId;
    if (!companyId || !store.jobs.some(job => job.id === jobId && job.company.id === companyId)) return apiError(404, 'NOT_FOUND', 'Tin không thuộc công ty của bạn.');
    if (scenario === 'error') return apiError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải danh sách ứng viên.');
    const items: components['schemas']['JobApplicant'][] = getRecruiterApplicationStore().filter(item => item.jobId === jobId && item.cvId).map(item => ({
        id: item.id, jobId: item.jobId, applicantId: item.candidate.id, resumeId: item.cvId!,
        fullName: item.candidate.fullName, headline: item.candidate.headline, jobTitle: item.jobTitle,
        email: item.profile?.email, resumeFileName: 'candidate-cv.pdf', resumeContentType: 'application/pdf',
        employmentType: store.jobs.find(job => job.id === jobId)?.workType,
        status: item.status === 'interview' ? 'interview_scheduled' : item.status, version: 0, appliedAt: item.appliedAt,
        ...updates.get(item.id),
    }));
    const filtered = scenario === 'empty' ? [] : items.filter(item => !query.status || item.status === query.status);
    const result: components['schemas']['JobApplicantPage'] = { items: filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), meta: { page: query.page, pageSize: query.pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / query.pageSize) } };
    return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function updateMockJobApplicantStatus(user: components['schemas']['User'], id: string, values: components['schemas']['JobApplicantStatusUpdate']) {
    const response = await mockJobApplicationDetail(user, id, 'detail');
    if (!response.ok) return response;
    const item: Applicant = await response.json();
    if (item.version !== values.version || !JOB_APPLICANT_TRANSITIONS[item.status].includes(values.status)) return apiError(409, 'CONFLICT', 'Hồ sơ đã thay đổi hoặc chuyển trạng thái không hợp lệ.');
    const update = { status: values.status, version: item.version + 1 };
    updates.set(id, update);
    return Response.json({ ...item, ...update }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function mockJobApplicationDetail(user: components['schemas']['User'], id: string, resource: 'detail' | 'resume' | 'cv') {
    const item = getRecruiterApplicationStore().find(item => item.id === id);
    if (!item) return apiError(404, 'NOT_FOUND', 'Không tìm thấy hồ sơ.');
    const index = getRecruiterApplicationStore().filter(entry => entry.jobId === item.jobId && entry.cvId).findIndex(entry => entry.id === id);
    const response = mockJobApplicants(user, item.jobId, { page: Math.floor(index / 100) + 1, pageSize: 100 });
    if (!response.ok) return response;
    const page: components['schemas']['JobApplicantPage'] = await response.json();
    const application = page.items.find(entry => entry.id === id);
    if (!application) return apiError(404, 'NOT_FOUND', 'Không tìm thấy hồ sơ.');
    if (resource === 'cv') return new Response(createSyntheticCvPdf(application.fullName ?? 'Candidate', application.headline ?? '', []), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="candidate-cv.pdf"', 'Cache-Control': 'private, no-store' } });
    return Response.json(resource === 'resume' ? { url: `/api/bff/recruiter/applications/${id}/cv`, expiresAt: new Date(Date.now() + 300000).toISOString() } : application, { headers: { 'Cache-Control': 'private, no-store' } });
}
