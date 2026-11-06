import { afterEach, expect, it, vi } from 'vitest';
import { handleJobApplicationDetail } from '@/server/bff/recruiter/job-application-detail-service';
import example from '../../contracts/examples/job-applicants.json';
import { pdfCv } from '../support/cv-files';

const item = example.items[0];
const base = 'http://application.test/api/v1';
const request = new Request(`http://localhost/api/bff/recruiter/job-applications/${item.id}`, { headers: { cookie: 'access_token=test-token' } });
function network(data: unknown, status = 200, role = 'RECRUITER') {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (String(url).endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: item.applicantId, email: 'recruiter@example.test', displayName: 'Recruiter Test', status: 'ACTIVE', roles: [role] } } });
        expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token');
        return Response.json({ success: true, data }, { status });
    });
}
afterEach(() => vi.restoreAllMocks());

it('loads the owned application through the detail API and strips storage metadata', async () => {
    const fetch = network({ ...item, createdAt: item.appliedAt, applicantSnapshot: { fullName: item.fullName, headline: item.headline, email: item.email }, jobSnapshot: { title: item.jobTitle, employmentType: item.employmentType }, storageKey: 'private-storage' });
    const response = await handleJobApplicationDetail(request, item.id, 'detail', base);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(item);
    expect(String(fetch.mock.calls.at(-1)![0])).toBe(`${base}/applications/${item.id}`);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
});

it('returns only a valid unexpired resume URL from the application resume endpoint', async () => {
    const data = { url: 'https://res.cloudinary.com/example/raw/authenticated/resume.pdf?signature=test', expiresAt: new Date(Date.now() + 300000).toISOString() };
    const fetch = network(data);
    const response = await handleJobApplicationDetail(request, item.id, 'resume', base);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(data);
    expect(String(fetch.mock.calls.at(-1)![0])).toBe(`${base}/applications/${item.id}/resume`);
    for (const bad of [{ ...data, url: 'javascript:alert(1)' }, { ...data, expiresAt: '2000-01-01T00:00:00Z' }]) {
        network(bad);
        expect((await handleJobApplicationDetail(request, item.id, 'resume', base)).status).toBe(503);
    }
});

it('requires recruiter identity and preserves denied/missing resource responses', async () => {
    const fetch = network({}, 200, 'CANDIDATE');
    expect((await handleJobApplicationDetail(request, item.id, 'detail', base)).status).toBe(403);
    expect(fetch.mock.calls.filter(([url]) => !String(url).endsWith('/auth/me'))).toHaveLength(0);
    for (const status of [403, 404]) {
        network({}, status);
        expect((await handleJobApplicationDetail(request, item.id, 'detail', base)).status).toBe(status);
    }
});

it('serves PDF inline from trusted storage without forwarding the user token', async () => {
    const url = 'https://api.cloudinary.com/v1_1/example/raw/download?signature=test';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (target, init) => {
        if (String(target).endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: item.applicantId, email: 'recruiter@example.test', displayName: 'Recruiter', status: 'ACTIVE', roles: ['RECRUITER'] } } });
        if (String(target) === url) {
            expect(new Headers(init?.headers).has('Authorization')).toBe(false);
            return new Response(pdfCv(), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment' } });
        }
        return Response.json({ success: true, data: { url, expiresAt: new Date(Date.now() + 300000).toISOString() } });
    });
    const response = await handleJobApplicationDetail(request, item.id, 'cv', base);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('inline');
    expect(await response.text()).toContain('%PDF-');
    network({ url: 'https://localhost/internal', expiresAt: new Date(Date.now() + 300000).toISOString() });
    expect((await handleJobApplicationDetail(request, item.id, 'cv', base)).status).toBe(503);
});
