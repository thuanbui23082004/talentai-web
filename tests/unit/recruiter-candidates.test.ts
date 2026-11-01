import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { recruiterApplicationPageSchema, recruiterApplicationQuerySchema, candidateSearchSchema } from '@/lib/api/application-schemas';
import { mockApplications } from '@/mocks/fixtures/applications';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { selectRecruiterApplications } from '@/server/bff/recruiter-application-query';
import { createSyntheticCvPdf } from '@/server/bff/recruiter-cv-document';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { getRecruiterMockStore, createMockRecruiterSession } from '@/server/bff/recruiter-mock-store';

const visible = new Set(mockJobs.map(job => job.id));
describe('candidate filters', () => {
  it('paginates without duplicate or missing records and keeps the source order', () => {
    const first = selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({}), visible);
    const second = selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({ page: 2 }), visible);
    expect(first.meta).toEqual({ page: 1, pageSize: 9, totalItems: 27, totalPages: 3 });
    expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(18);
    expect(mockApplications[0].candidate.fullName).toBe('Mai An');
  });
  it('matches Vietnamese names without accents and applies all skill filters', () => {
    expect(selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({ q: 'bao minh' }), visible).items.map(item => item.candidate.fullName)).toEqual(['Bảo Minh']);
    const result = selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({ skills: ['React', 'TypeScript'], status: ['reviewing'], minExperienceYears: 3 }), visible);
    expect(result.meta.totalItems).toBeGreaterThan(0);
    expect(result.items.every(item => item.status === 'reviewing' && (item.candidate.totalYearsExperience ?? 0) >= 3 && item.candidate.topSkills?.includes('React'))).toBe(true);
  });
  it('orders by date/experience and never exposes another company records', () => {
    const oldest = selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({ sort: 'applied_asc' }), visible);
    expect(oldest.items[0].id).toBe(mockApplications[26].id);
    const experienced = selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({ sort: 'experience_desc' }), visible);
    expect(experienced.items[0].candidate.totalYearsExperience).toBe(6);
    expect(selectRecruiterApplications(mockApplications, recruiterApplicationQuerySchema.parse({}), new Set()).meta.totalItems).toBe(0);
  });
  it.each([{ page: 0 }, { pageSize: 101 }, { status: ['unknown'] }, { sort: 'name' }, { minExperienceYears: -1 }, { minMatchScore: 101 }, { jobId: 'invalid' }])('rejects unsupported query values', query => {
    expect(recruiterApplicationQuerySchema.safeParse(query).success).toBe(false);
  });
  it('blocks email/phone search before building an API request', () => {
    expect(candidateSearchSchema.safeParse('fictional@example.test').success).toBe(false);
    expect(candidateSearchSchema.safeParse('032 000 0000').success).toBe(false);
    expect(candidateSearchSchema.safeParse('React TypeScript').success).toBe(true);
  });
  it('returns a complete PDF with correct byte offsets and escaped text', () => {
    const pdf = new TextDecoder().decode(createSyntheticCvPdf('Hà Linh', 'Developer (Web)', ['React']));
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('Developer \\(Web\\)');
    const match = /startxref\n(\d+)/.exec(pdf);
    expect(match).not.toBeNull();
    expect(pdf.slice(Number(match?.[1]), Number(match?.[1]) + 4)).toBe('xref');
    expect(pdf.endsWith('%%EOF')).toBe(true);
  });
});

beforeEach(() => { const store = getRecruiterMockStore(); store.jobs = structuredClone(mockJobs); store.sessions.clear(); });
async function sessionCookie() {
  const created = createMockRecruiterSession();
  return { cookie: `access_token=${created.id}`, id: created.id };
}
describe('candidate mock API', () => {
  it('returns list data and an authenticated PDF with no public caching', async () => {
    const auth = await sessionCookie();
    const response = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/applications?pageSize=9', { headers: { cookie: auth.cookie } }), 'recruiter/applications');
    expect(response.status).toBe(200);
    const page = recruiterApplicationPageSchema.parse(await response.json());
    expect(page.meta.totalItems).toBe(27);
    const path = `recruiter/applications/${page.items[0].id}/cv`;
    const cv = await handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}?disposition=inline`, { headers: { cookie: auth.cookie } }), path);
    expect(cv.status).toBe(200);
    expect(cv.headers.get('Content-Type')).toBe('application/pdf');
    expect(cv.headers.get('Cache-Control')).toBe('private, no-store');
    expect((await cv.text()).startsWith('%PDF-')).toBe(true);
  });
  it('rejects missing sessions, wrong role and another company CV', async () => {
    const path = `recruiter/applications/${mockApplications[0].id}/cv`;
    expect((await handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`), path)).status).toBe(401);
    const auth = await sessionCookie();
    const session = getRecruiterMockStore().sessions.get(auth.id);
    if (!session) throw new Error('Missing session');
    session.role = 'candidate';
    expect((await handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { headers: { cookie: auth.cookie } }), path)).status).toBe(403);
    session.role = 'recruiter';
    session.companyId = '00000000-0000-4000-8000-999999999999';
    expect((await handleMockRequest(new NextRequest(`http://localhost/api/bff/${path}`, { headers: { cookie: auth.cookie } }), path)).status).toBe(404);
  });
  it('handles missing CV, invalid filters and empty results', async () => {
    const auth = await sessionCookie();
    const missing = `recruiter/applications/${mockApplications[26].id}/cv`;
    expect((await handleMockRequest(new NextRequest(`http://localhost/api/bff/${missing}`, { headers: { cookie: auth.cookie } }), missing)).status).toBe(404);
    expect((await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/applications?page=-1', { headers: { cookie: auth.cookie } }), 'recruiter/applications')).status).toBe(422);
    const empty = await handleMockRequest(new NextRequest('http://localhost/api/bff/recruiter/applications', { headers: { cookie: auth.cookie, 'x-mock-scenario': 'empty' } }), 'recruiter/applications');
    expect(recruiterApplicationPageSchema.parse(await empty.json()).items).toEqual([]);
  });
});
