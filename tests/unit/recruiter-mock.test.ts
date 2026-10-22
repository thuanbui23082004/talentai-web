import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { recruiterJobPageSchema, recruiterJobSchema } from '@/lib/api/job-schemas';
import { z } from 'zod';

const body = { title: 'Tin tuyển dụng mới', industryId: '00000000-0000-4000-8000-000000000001', description: 'Mô tả.', requirements: 'Yêu cầu.', workType: 'full_time', level: 'junior', location: { city: 'Hà Nội' } };
async function session() {
  const response = await handleMockRequest(new NextRequest('http://localhost/api/bff/auth/csrf'), 'auth/csrf');
  const data = z.object({ csrfToken: z.string() }).parse(await response.json());
  const cookie = response.cookies.get('talentai_mock_session');
  if (!cookie) throw new Error('Mock session not created');
  return { cookie: `talentai_mock_session=${cookie.value}`, token: data.csrfToken, id: cookie.value };
}
beforeEach(() => { const store = getRecruiterMockStore(); store.jobs = structuredClone(mockJobs); store.sessions.clear(); });
describe('recruiter mock API', () => {
  it('creates a draft that list and detail read from the same store', async () => {
    const auth = await session();
    const created = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/jobs', { method: 'POST', headers: { cookie: auth.cookie, 'X-CSRF-Token': auth.token, 'content-type': 'application/json' }, body: JSON.stringify(body) }), 'recruiter/jobs');
    expect(created.status).toBe(201);
    const job = recruiterJobSchema.parse(await created.json());
    expect(job.status).toBe('draft');
    const detail = await handleMockRequest(new NextRequest(`http://localhost/api/bff/recruiter/jobs/${job.id}`, { headers: { cookie: auth.cookie } }), `recruiter/jobs/${job.id}`);
    expect(recruiterJobSchema.parse(await detail.json()).title).toBe(body.title);
    const list = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/jobs', { headers: { cookie: auth.cookie } }), 'recruiter/jobs');
    expect(recruiterJobPageSchema.parse(await list.json()).items[0].id).toBe(job.id);
  });
  it('rejects missing session, CSRF and incorrect role without adding jobs', async () => {
    const request = () => new NextRequest('http://localhost/api/bff/recruiter/jobs', { method: 'POST', body: JSON.stringify(body) });
    expect((await handleMockRequest(request(), 'recruiter/jobs')).status).toBe(401);
    const auth = await session();
    expect((await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/jobs', { method: 'POST', headers: { cookie: auth.cookie }, body: JSON.stringify(body) }), 'recruiter/jobs')).status).toBe(403);
    const current = getRecruiterMockStore().sessions.get(auth.id);
    if (current) current.role = 'candidate';
    expect((await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/jobs', { headers: { cookie: auth.cookie } }), 'recruiter/jobs')).status).toBe(403);
    expect(getRecruiterMockStore().jobs).toHaveLength(mockJobs.length);
  });
  it('returns 422 for invalid payload and respects empty scenario', async () => {
    const auth = await session();
    const response = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/jobs', { method: 'POST', headers: { cookie: auth.cookie, 'X-CSRF-Token': auth.token }, body: JSON.stringify({ ...body, title: 'a' }) }), 'recruiter/jobs');
    expect(response.status).toBe(422);
    const empty = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/jobs', { headers: { cookie: auth.cookie, 'x-mock-scenario': 'empty' } }), 'recruiter/jobs');
    expect(recruiterJobPageSchema.parse(await empty.json()).items).toEqual([]);
  });
});
