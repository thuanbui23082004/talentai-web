import { afterEach, describe, expect, it, vi } from 'vitest';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { handleRecruiterMatching } from '@/server/bff/recruiter/matching-results';

const session = vi.hoisted(() => ({ role: 'recruiter', signedIn: true }));
vi.mock('@/server/bff/auth/session', () => ({ readRequestIdentity: async () => session.signedIn ? { user: { role: session.role }, access: 'test-access' } : null }));

const applicationId = '123e4567-e89b-42d3-a456-426614174001';
const jobId = '123e4567-e89b-42d3-a456-426614174002';
const result = { applicationId, jobId, status: 'SCORED', score: 75, details: { score: 75, semantic_score: 70, skill_score: 80, matched_skills: ['TypeScript'], missing_skills: ['React'], explanation: 'CV phù hợp một phần.', field_scores: {} }, scoredAt: '2026-11-27T08:00:00Z' };
const gateway = 'http://gateway.test/api/v1';
const request = (path: string, method = 'GET', body?: unknown, csrf = '') => new Request(`http://localhost/api/bff/matching${path}`, { method, headers: { ...(csrf ? { 'X-CSRF-Token': csrf } : {}), cookie: 'access_token=test-access', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });

afterEach(() => { vi.restoreAllMocks(); session.role = 'recruiter'; session.signedIn = true; });

describe('recruiter matching BFF', () => {
  it('distinguishes a missing backend route from denied access', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
    const missing = await handleRecruiterMatching(request(`/applications/${applicationId}`), gateway);
    expect(missing.status).toBe(503);
    expect((await missing.json()).error.code).toBe('SERVICE_UNAVAILABLE');
    fetcher.mockResolvedValue(new Response(null, { status: 403 }));
    const denied = await handleRecruiterMatching(request(`/applications/${applicationId}`), gateway);
    expect(denied.status).toBe(403);
    expect((await denied.json()).error.code).toBe('FORBIDDEN');
  });
  it('forwards the application bearer token and validates its result', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(result));
    const response = await handleRecruiterMatching(request(`/applications/${applicationId}`), gateway);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${gateway}/matching/applications/${applicationId}`);
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer test-access');
  });

  it('reads a batch in application order and rejects mismatched results', async () => {
    const csrf = csrfTokenFor({ access: 'test-access' });
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([result]));
    const batch = request('/applications/results:batch', 'POST', { jobId, applicationIds: [applicationId] }, csrf);
    expect((await handleRecruiterMatching(batch, gateway)).status).toBe(200);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${gateway}/matching/applications/results:batch`);
    fetcher.mockResolvedValue(Response.json([{ ...result, applicationId: jobId }]));
    expect((await handleRecruiterMatching(request('/applications/results:batch', 'POST', { jobId, applicationIds: [applicationId] }, csrf), gateway)).status).toBe(503);
  });

  it('reads the ranking page and blocks anonymous or other roles', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ jobId, page: 0, size: 20, total: 1, items: [{ rank: 1, applicationId, score: 75, scoredAt: result.scoredAt }] }));
    expect((await handleRecruiterMatching(request(`/jobs/${jobId}/rankings?page=0&size=20`), gateway)).status).toBe(200);
    session.role = 'candidate';
    expect((await handleRecruiterMatching(request(`/jobs/${jobId}/rankings`), gateway)).status).toBe(403);
    session.signedIn = false;
    expect((await handleRecruiterMatching(request(`/applications/${applicationId}`), gateway)).status).toBe(401);
  });
});
