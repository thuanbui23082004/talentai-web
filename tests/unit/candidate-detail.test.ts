import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { candidateDetailSchema, evaluationInputSchema, interviewInputSchema, interviewSchema } from '@/lib/api/candidate-detail-schemas';
import { statusFormSchema, interviewFormSchema, interviewFormToInput } from '@/features/applications/schemas/candidate-detail-forms';
import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { createMockRecruiterSession, getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { recruiterApplicationPageSchema } from '@/lib/api/application-schemas';

const applicationId = mockCandidateDetails[0].id;
const validInterview = { applicationId, startTime: '2030-10-25T03:00:00Z', endTime: '2030-10-25T04:00:00Z', mode: 'online' as const, meetingUrl: 'https://example.test/meeting', interviewers: ['Người phỏng vấn giả'] };
beforeEach(() => {
  const store = getRecruiterMockStore();
  store.jobs = structuredClone(mockJobs); store.sessions.clear();
  getRecruiterApplicationStore().splice(0, getRecruiterApplicationStore().length, ...structuredClone(mockCandidateDetails));
});
function auth() {
  const created = createMockRecruiterSession();
  return { cookie: `access_token=${created.id}`, token: created.session.csrf, session: created.session };
}
function request(path: string, authorization: ReturnType<typeof auth>, method = 'GET', body?: unknown, key?: string) {
  return handleMockRequest(new NextRequest('http://localhost/api/bff/' + path, { method, headers: { cookie: authorization.cookie, 'X-CSRF-Token': authorization.token, ...(key ? { 'Idempotency-Key': key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }), path);
}
describe('candidate detail validation', () => {
  it('parses profile safely and drops identifiers that recruiter must not see', () => {
    const seed = mockCandidateDetails[0];
    const parsed = candidateDetailSchema.parse({ ...seed, profile: { ...seed.profile, nationalIdMasked: '********0000' } });
    expect(parsed.profile).not.toHaveProperty('nationalIdMasked');
    expect(parsed.matching?.score).toBe(78);
  });
  it('requires explicit confirmation for hiring/rejection', () => {
    expect(statusFormSchema.safeParse({ status: 'hired', round: '', note: '', confirmed: false }).success).toBe(false);
    expect(statusFormSchema.safeParse({ status: 'rejected', round: '', note: '', confirmed: true }).success).toBe(true);
  });
  it('keeps recruiter rating 1–5 and validates interview times and URLs', () => {
    expect(interviewFormSchema.safeParse({ start: '', end: '', mode: 'online', round: '', location: '', meetingUrl: '', participants: '', message: '', sendInvitation: true }).success).toBe(false);
    expect(evaluationInputSchema.safeParse({ rating: 78 }).success).toBe(false);
    expect(interviewInputSchema.safeParse({ ...validInterview, endTime: validInterview.startTime }).success).toBe(false);
    expect(interviewInputSchema.safeParse({ ...validInterview, meetingUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(interviewInputSchema.safeParse({ ...validInterview, mode: 'offline', location: '' }).success).toBe(false);
  });
  it('converts explicitly entered Vietnam time into UTC independently of host timezone', () => {
    const values = { start: '2030-10-25T10:00', end: '2030-10-25T11:00', mode: 'online' as const, round: '', location: '', meetingUrl: 'https://example.test/meeting', participants: 'Nhân sự, Kỹ thuật', message: '', sendInvitation: true };
    expect(interviewFormSchema.safeParse(values).success).toBe(true);
    expect(interviewFormToInput(applicationId, values).startTime).toBe('2030-10-25T03:00:00.000Z');
  });
});
describe('candidate detail mock mutations', () => {
  it('updates status/history and returns the same status in list and detail', async () => {
    const authorization = auth();
    const path = `recruiter/applications/${applicationId}`;
    const response = await request(path + '/status', authorization, 'PATCH', { status: 'interview', round: 'Phỏng vấn chuyên môn', notifyCandidate: true });
    expect(response.status).toBe(200);
    const detail = candidateDetailSchema.parse(await response.json());
    expect(detail.statusHistory?.at(-1)?.status).toBe('interview');
    expect(detail.currentRound).toBe('Phỏng vấn chuyên môn');
    const list = await request('recruiter/applications', authorization);
    const summary = recruiterApplicationPageSchema.parse(await list.json()).items.find(item => item.id === applicationId);
    expect(summary?.status).toBe('interview');
    expect(summary).not.toHaveProperty('profile');
  });
  it('saves manual evaluation without modifying the AI score', async () => {
    const authorization = auth();
    const response = await request(`recruiter/applications/${applicationId}/evaluation`, authorization, 'PUT', { rating: 4, classification: 'potential', note: 'Cần trao đổi thêm về dự án.' });
    expect(response.status).toBe(200);
    const detail = candidateDetailSchema.parse(await (await request(`recruiter/applications/${applicationId}`, authorization)).json());
    expect(detail.evaluation?.rating).toBe(4);
    expect(detail.matching?.score).toBe(78);
  });
  it('creates one interview for a repeated idempotency key and rejects overlaps', async () => {
    const authorization = auth();
    const key = 'detail-interview-unit';
    const created = await request('recruiter/interviews', authorization, 'POST', validInterview, key);
    expect(created.status).toBe(201);
    const interview = interviewSchema.parse(await created.json());
    const duplicate = await request('recruiter/interviews', authorization, 'POST', validInterview, key);
    expect(interviewSchema.parse(await duplicate.json()).id).toBe(interview.id);
    expect(getRecruiterApplicationStore()[0].interviews).toHaveLength(1);
    const conflict = await request('recruiter/interviews', authorization, 'POST', validInterview, 'different-key');
    expect(conflict.status).toBe(409);
  });
  it('enforces ownership, CSRF, valid rounds and withdrawn state', async () => {
    const authorization = auth();
    const path = `recruiter/applications/${applicationId}`;
    expect((await request(path + '/status', authorization, 'PATCH', { status: 'reviewing', round: 'Invented' })).status).toBe(422);
    const changed = getRecruiterApplicationStore()[0];
    changed.status = 'withdrawn';
    expect((await request(path + '/status', authorization, 'PATCH', { status: 'hired' })).status).toBe(409);
    expect((await request(path + '/evaluation', { ...authorization, token: 'wrong' }, 'PUT', { rating: 4 })).status).toBe(403);
    authorization.session.companyId = '00000000-0000-4000-8000-999999999999';
    expect((await request(path, authorization)).status).toBe(404);
    expect((await request('recruiter/interviews', authorization, 'POST', validInterview)).status).toBe(404);
  });
});
