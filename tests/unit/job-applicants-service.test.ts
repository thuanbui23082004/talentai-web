import { afterEach, expect, it, vi } from 'vitest';
import { handleJobApplicants } from '@/server/bff/recruiter/job-applicants-service';
import example from '../../contracts/examples/job-applicants.json';

const jobId = example.items[0].jobId;
const request = (query = '', cookie = 'access_token=test-token') => new Request(`http://localhost/api/bff/recruiter/jobs/${jobId}/applications${query}`, { headers: { cookie } });
function network(status = 200, role = 'RECRUITER', wrongJob = false) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (String(url).endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: example.items[0].applicantId, email: 'recruiter@example.test', displayName: 'Recruiter Test', status: 'ACTIVE', roles: [role] } } });
        const item = example.items[0];
        return Response.json(status === 200 ? { success: true, data: { items: [{ id: item.id, jobId: wrongJob ? item.id : jobId, applicantId: item.applicantId, resumeId: item.resumeId, status: item.status, version: item.version, createdAt: item.appliedAt, resumeFileName: item.resumeFileName, resumeContentType: item.resumeContentType, coverLetter: item.coverLetter, jobSnapshot: { title: item.jobTitle, employmentType: item.employmentType }, applicantSnapshot: { fullName: item.fullName, headline: item.headline, email: item.email, storageKey: 'secret-storage' } }], page: 1, size: 9, totalElements: 10, totalPages: 2 } } : { error: { code: 'private-error', message: 'private backend details' } }, { status });
    });
}
afterEach(() => vi.restoreAllMocks());

it('forwards job/status/paging with bearer token and returns only display fields', async () => {
    const fetch = network();
    const response = await handleJobApplicants(request('?status=shortlisted&page=2&pageSize=9'), jobId, 'http://application.test/api/v1');
    expect(response.status).toBe(200);
    const call = fetch.mock.calls.find(([url]) => String(url).includes('/recruiter/jobs/'))!;
    expect(String(call[0])).toBe(`http://application.test/api/v1/recruiter/jobs/${jobId}/applications?page=1&size=9&status=shortlisted`);
    expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer test-token');
    const body = await response.json();
    expect(body.items).toEqual(example.items);
    expect(body.meta).toEqual({ page: 2, pageSize: 9, totalItems: 10, totalPages: 2 });
    expect(JSON.stringify(body)).not.toContain('secret-storage');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
});

it('rejects anonymous/wrong roles and unsupported filters without reading applications', async () => {
    const fetch = network(200, 'CANDIDATE');
    expect((await handleJobApplicants(request('', ''), jobId, 'http://application.test')).status).toBe(401);
    expect((await handleJobApplicants(request(), jobId, 'http://application.test')).status).toBe(403);
    for (const query of ['?q=React', '?page=0', '?status=unknown']) expect((await handleJobApplicants(request(query), jobId, 'http://application.test')).status).toBe(422);
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/recruiter/jobs/'))).toHaveLength(0);
});

it('preserves ownership errors and rejects mismatched or unavailable upstream data', async () => {
    for (const status of [403, 404, 503]) {
        network(status);
        const response = await handleJobApplicants(request(), jobId, 'http://application.test');
        expect(response.status).toBe(status);
        expect(await response.text()).not.toContain('private backend details');
    }
    network(200, 'RECRUITER', true);
    expect((await handleJobApplicants(request(), jobId, 'http://application.test')).status).toBe(503);
});
