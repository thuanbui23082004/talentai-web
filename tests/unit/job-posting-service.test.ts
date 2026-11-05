import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleRecruiterJobPostings } from '@/server/bff/recruiter/job-posting-service';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { jobPostingDefaults, toJobPostingInput, jobPostingFormSchema } from '@/features/jobs/schemas/job-posting-form';
import { mapRecruiterPosting } from '@/server/bff/recruiter/job-posting-mapper';
import { jobPostingRecordSchema } from '@/lib/api/job-posting-schemas';
import input from '../../contracts/examples/job-posting-input.json';

const base = 'http://job.test/api/v1';
const companyBase = 'http://company.test/api/v1';
const id = '123e4567-e89b-42d3-a456-426614174000';
const company = { id, name: 'Integration Test Company' };
const access = 'posting-access';
const record = jobPostingRecordSchema.parse({ ...input, workplace: undefined, addressLine: undefined, jobPostId: id, companyId: id, status: 'DRAFT', version: 0,
  location: '12 Hùng Vương, Phường Ba Đình, Thành phố Hà Nội', locations: [{ provinceId: 1000001, wardId: 3000004, addressLine: input.addressLine }],
  createdAt: '2026-11-05T00:00:00Z', updatedAt: '2026-11-05T00:00:00Z' });
const page = (items: unknown[], totalPages = 1) => ({ items, page: 0, size: 100, totalPages, totalElements: items.length });
const json = (data: unknown, code = 200) => Response.json({ code, data });
function request(method = 'POST', suffix = '', body: unknown = input, headers: Record<string, string> = {}) {
  return new Request(`https://web.test/api/bff/recruiter/jobs${suffix}`, { method,
    headers: { Cookie: `access_token=${access}`, 'X-CSRF-Token': csrfTokenFor({ access }), Origin: 'https://web.test', 'Content-Type': 'application/json', ...headers },
    ...(method === 'GET' || method === 'DELETE' ? {} : { body: JSON.stringify(body) }),
  });
}
function network(override?: (url: string, init?: RequestInit) => Response | undefined, role = 'RECRUITER') {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const path = String(url);
    if (path.endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id, email: 'posting@example.test', displayName: 'Test User', status: 'ACTIVE', roles: [role] } } });
    const custom = override?.(path, init);
    if (custom) return custom;
    if (path === `${companyBase}/recruiter/company`) return json(company);
    if (path.endsWith('/job-locations')) return json([{ id: 1000001, code: '1', name: 'Thành phố Hà Nội', type: 'PROVINCE', parentId: null }]);
    if (path.endsWith('/job-locations?parentId=1000001')) return json([{ id: 3000004, code: '4', name: 'Phường Ba Đình', type: 'WARD', parentId: 1000001 }]);
    if (path.endsWith('/job-categories')) return json([{ categoryId: 1, categoryName: 'Software Engineering' }]);
    if (path.includes('/skills?')) return json(page([{ skillId: 2, skillName: 'React' }]));
    if (path.endsWith('/recruiter/jobs') && init?.method === 'POST') return json(record, 201);
    if (path.includes('/recruiter/jobs?page=')) return json(page([record]));
    if (path.endsWith(`/recruiter/jobs/${id}`)) return json(record);
    throw new Error(`Unexpected request: ${path}`);
  });
}
const handle = (req: Request) => handleRecruiterJobPostings(req, base, companyBase);
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('recruiter job posting backend', () => {
  it('creates exactly one draft using real location IDs and verified bearer token', async () => {
    const fetch = network();
    const response = await handle(request());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ id, company, status: 'draft', posting: { version: 0, workplace: input.workplace, skillIds: [2, 3] } });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const writes = fetch.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(writes).toHaveLength(1);
    expect(writes[0][0]).toBe(`${base}/recruiter/jobs`);
    const payload = JSON.parse(String(writes[0][1]?.body));
    expect(payload).toMatchObject({ categoryId: 1, skillIds: [2, 3], locations: record.locations, salaryMin: 15000000 });
    expect(payload).not.toHaveProperty('workplace');
    expect(payload).not.toHaveProperty('addressLine');
    expect(payload).not.toHaveProperty('version');
    expect(writes[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${access}` });
    expect(JSON.stringify(body)).not.toContain(access);
  });

  it('rejects wrong roles, anonymous requests, bad CSRF and cross-origin writes', async () => {
    const fetch = network(undefined, 'CANDIDATE');
    expect((await handle(request('GET', '', input, { Cookie: '' }))).status).toBe(401);
    expect((await handle(request('POST', '', input, { 'X-CSRF-Token': 'bad' }))).status).toBe(403);
    expect((await handle(request('POST', '', input, { Origin: 'https://evil.test' }))).status).toBe(403);
    expect((await handle(request())).status).toBe(403);
    expect(fetch.mock.calls.filter(([url]) => !String(url).endsWith('/auth/me'))).toHaveLength(0);
  });

  it('rejects unsupported fields and invalid salary without sending a write', async () => {
    const fetch = network();
    for (const body of [{ ...input, level: 'manager' }, { ...input, salaryMin: 30000000 }, { ...input, skillIds: [2, 2] }, { ...input, categoryId: -1 }])
      expect((await handle(request('POST', '', body))).status).toBe(422);
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('rejects a ward outside the selected province before creating a draft', async () => {
    const fetch = network();
    expect((await handle(request('POST', '', { ...input, workplace: '1:99999' }))).status).toBe(422);
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('does not retry a failed POST or fall back to mock success', async () => {
    const fetch = network((url, init) => url === `${base}/recruiter/jobs` && init?.method === 'POST' ? new Response('private backend details', { status: 500 }) : undefined);
    const response = await handle(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private backend details');
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it('does not create a draft when the company lookup fails', async () => {
    const fetch = network(url => url === `${companyBase}/recruiter/company` ? new Response(null, { status: 404 }) : undefined);
    expect((await handle(request())).status).toBe(404);
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('returns catalogs and retrieves every page of skills', async () => {
    const fetch = network(url => url.endsWith('skills?page=0&size=100') ? json(page([{ skillId: 2, skillName: 'React' }], 2))
      : url.endsWith('skills?page=1&size=100') ? json(page([{ skillId: 3, skillName: 'TypeScript' }], 2)) : undefined);
    const response = await handle(request('GET', '/options'));
    expect(response.status).toBe(200);
    expect((await response.json()).skills).toHaveLength(2);
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/catalog/'))).toBe(false);
  });

  it('loads the saved draft with editable province and ward codes', async () => {
    network();
    const response = await handle(request('GET', `/${id}`));
    expect(response.status).toBe(200);
    expect((await response.json()).posting).toMatchObject({ workplace: '1:00004', addressLine: input.addressLine, version: 0 });
  });

  it('loads real list data with zero-based to one-based pagination', async () => {
    network();
    const response = await handle(request('GET', '?page=1&pageSize=100'));
    expect(response.status).toBe(200);
    expect((await response.json()).items[0].id).toBe(id);
  });

  it('does not expose a draft returned for another company', async () => {
    network((url, init) => url.endsWith('/recruiter/jobs') && init?.method === 'POST' ? json({ ...record, companyId: '223e4567-e89b-42d3-a456-426614174000' }, 201) : undefined);
    expect((await handle(request())).status).toBe(403);
  });

  it('requires the saved version for updates', async () => {
    const fetch = network();
    expect((await handle(request('PUT', `/${id}`))).status).toBe(422);
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
    expect((await handle(request('PUT', `/${id}`, { ...input, version: 0 }))).status).toBe(200);
    const update = fetch.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(JSON.parse(String(update?.[1]?.body)).version).toBe(0);
  });

  it('sends the displayed version for lifecycle commands and reports conflicts', async () => {
    const fetch = network((url, init) => url.endsWith('/publish') && init?.method === 'POST' ? new Response(null, { status: 409 }) : undefined);
    expect((await handle(request('POST', `/${id}/publish`, {}))).status).toBe(422);
    expect((await handle(request('POST', `/${id}/publish`, {}, { 'If-Match': '0' }))).status).toBe(409);
    const calls = fetch.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ version: 0 });
  });

  it('deletes using the version the user confirmed, without retrying', async () => {
    const fetch = network((url, init) => url.endsWith(`/${id}?version=3`) && init?.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined);
    expect((await handle(request('DELETE', `/${id}`, undefined, { 'If-Match': '3' }))).status).toBe(204);
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(1);
  });
});

describe('job posting form mapping', () => {
  it('converts salary units, selected skill IDs and a Vietnamese end-of-day deadline', () => {
    const value = { ...jobPostingDefaults(), title: input.title, description: input.description, requirements: input.requirements,
      categoryId: '1', skillIds: ['2', '3'], salaryMin: '15', salaryMax: '25', applicationDeadline: '2026-12-31', workplace: '1:00004' };
    expect(jobPostingFormSchema.safeParse(value).success).toBe(true);
    const payload = toJobPostingInput(value);
    expect(payload).toMatchObject({ salaryMin: 15000000, skillIds: [2, 3], deadline: '2026-12-31T23:59:59+07:00' });
    for (const field of ['level', 'minExperienceYears', 'hiringRounds', 'educationLevel']) expect(payload).not.toHaveProperty(field);
  });

  it('restores the saved draft without losing work mode, IDs, currency or date', () => {
    const job = mapRecruiterPosting({ ...record, workplace: input.workplace }, company);
    const value = jobPostingDefaults(job);
    expect(value).toMatchObject({ skillIds: ['2', '3'], salaryMin: '15', applicationDeadline: '2026-12-31', workplace: input.workplace });
    expect(toJobPostingInput({ ...value, isSalaryNegotiable: true }, 0)).not.toHaveProperty('salaryMin');
  });
});
