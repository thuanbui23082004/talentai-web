import { beforeEach, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { interviewResultInputSchema, interviewSchema } from '@/lib/api/candidate-detail-schemas';
import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { createMockRecruiterSession, getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { handleMockRequest } from '@/server/bff/mock-adapter';

beforeEach(() => {
  getRecruiterMockStore().jobs = structuredClone(mockJobs);
  getRecruiterMockStore().sessions.clear();
  getRecruiterApplicationStore().splice(0, getRecruiterApplicationStore().length, ...structuredClone(mockCandidateDetails));
});
function setup() {
  const auth = createMockRecruiterSession();
  const application = getRecruiterApplicationStore()[0];
  const interview = { id: '00000000-0000-4000-8000-000000000999', applicationId: application.id, startTime: '2026-10-01T03:00:00Z', endTime: '2026-10-01T04:00:00Z', mode: 'online' as const, invitationStatus: 'accepted' as const, status: 'scheduled' as 'scheduled' | 'cancelled' | 'completed' };
  application.interviews = [interview];
  const request = (path: string, method = 'GET', body?: unknown, csrf = auth.session.csrf) => handleMockRequest(new NextRequest('http://localhost/api/bff/' + path, { method, headers: { cookie: `access_token=${auth.id}`, 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) }), path);
  return { auth, application, interview, request, path: `recruiter/interviews/${interview.id}/result` };
}
it('validates all contractual outcomes and rejects invalid or oversized input', () => {
  for (const result of ['passed', 'failed', 'need_more']) expect(interviewResultInputSchema.safeParse({ result }).success).toBe(true);
  expect(interviewResultInputSchema.safeParse({ result: 'hired' }).success).toBe(false);
  expect(interviewResultInputSchema.safeParse({ result: 'passed', note: 'x'.repeat(2001) }).success).toBe(false);
});
it('persists result and note in the interview timeline without moving the applicant', async () => {
  const { request, application, path } = setup();
  const before = structuredClone(application);
  const response = await request(path, 'PUT', { result: 'need_more', note: 'Cần trao đổi thêm về kinh nghiệm.' });
  expect(response.status).toBe(200);
  const interview = interviewSchema.parse(await response.json());
  expect(interview).toMatchObject({ status: 'completed', result: 'need_more', resultNote: 'Cần trao đổi thêm về kinh nghiệm.' });
  const list = await request(`recruiter/applications/${application.id}/interviews`);
  expect(await list.json()).toMatchObject({ items: [{ result: 'need_more' }] });
  expect(application.status).toBe(before.status);
  expect(application.currentRound).toBe(before.currentRound);
  expect(application.statusHistory).toEqual(before.statusHistory);
  expect((await request(path, 'PUT', { result: 'passed', note: 'Đạt vòng chuyên môn.' })).status).toBe(200);
  expect(application.interviews?.[0].result).toBe('passed');
});
it('rejects cancelled interviews, invalid bodies, missing CSRF and other companies', async () => {
  const { request, path, interview, auth } = setup();
  expect((await request(path, 'PUT', { result: 'invalid' })).status).toBe(422);
  expect((await request(path, 'PUT', { result: 'passed' }, 'invalid')).status).toBe(403);
  interview.status = 'cancelled';
  expect((await request(path, 'PUT', { result: 'passed' })).status).toBe(422);
  auth.session.companyId = '00000000-0000-4000-8000-000000000888';
  expect((await request(path, 'PUT', { result: 'passed' })).status).toBe(404);
});
