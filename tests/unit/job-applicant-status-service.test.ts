import { afterEach, expect, it, vi } from 'vitest';
import { handleJobApplicantStatus } from '@/server/bff/recruiter/job-applicant-status-service';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { JOB_APPLICANT_TRANSITIONS } from '@/lib/api/job-applicant-transitions';
import example from '../../contracts/examples/job-applicants.json';

const item = example.items[0];
const token = 'status-test-token';
const base = 'http://application.test/api/v1';
const values = { status: 'interview_scheduled', version: 0 };
function request(body: unknown = values, headers: Record<string, string> = {}) {
    return new Request(`http://localhost/api/bff/recruiter/job-applications/${item.id}/status`, { method: 'PATCH', body: JSON.stringify(body), headers: { Cookie: `access_token=${token}`, Origin: 'http://localhost', 'X-CSRF-Token': csrfTokenFor({ access: token }), 'Content-Type': 'application/json', ...headers } });
}
function network(status = 200, role = 'RECRUITER') {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (String(url).endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: item.applicantId, email: 'recruiter@example.test', displayName: 'Recruiter Test', status: 'ACTIVE', roles: [role] } } });
        expect(String(url)).toBe(`${base}/applications/${item.id}/status`);
        expect(init?.method).toBe('PATCH');
        expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
        expect(JSON.parse(String(init?.body))).toEqual(values);
        return Response.json(status === 200 ? { success: true, data: { ...item, ...values, version: 1, createdAt: item.appliedAt, applicantSnapshot: { fullName: item.fullName }, storageKey: 'secret' } } : { error: { code: 'STALE_VERSION', message: 'private backend details' } }, { status });
    });
}
afterEach(() => vi.restoreAllMocks());

it('sends the exact status/version once and maps the new version without storage fields', async () => {
    const fetch = network();
    const response = await handleJobApplicantStatus(request(), item.id, base);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: item.id, status: values.status, version: 1 });
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1);
});

it('requires CSRF, same origin, recruiter role and a valid nonnegative version', async () => {
    const fetch = network(200, 'CANDIDATE');
    expect((await handleJobApplicantStatus(request(values, { 'X-CSRF-Token': '' }), item.id, base)).status).toBe(403);
    expect((await handleJobApplicantStatus(request(values, { Origin: 'https://evil.test' }), item.id, base)).status).toBe(403);
    expect((await handleJobApplicantStatus(request(), item.id, base)).status).toBe(403);
    fetch.mockRestore();
    const recruiter = network();
    for (const body of [{ status: 'reviewing' }, { status: 'reviewing', version: -1 }, { ...values, jobId: item.jobId }]) expect((await handleJobApplicantStatus(request(body), item.id, base)).status).toBe(422);
    expect(recruiter.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(0);
});

it('preserves conflicts and ownership errors without retrying writes', async () => {
    for (const status of [403, 404, 409, 503]) {
        const fetch = network(status);
        const response = await handleJobApplicantStatus(request(), item.id, base);
        expect(response.status).toBe(status);
        expect(await response.text()).not.toContain('private backend details');
        expect(fetch.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1);
        fetch.mockRestore();
    }
    expect(JOB_APPLICANT_TRANSITIONS.submitted).toEqual(['reviewing', 'rejected']);
    for (const status of ['hired', 'withdrawn', 'rejected'] as const) expect(JOB_APPLICANT_TRANSITIONS[status]).toEqual([]);
});
