import { beforeEach, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { getRecruiterMockStore, createMockRecruiterSession } from '@/server/bff/recruiter-mock-store';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import { interviewPageSchema, managedInterviewSchema } from '@/features/interviews/schemas';
import { calendarDays, monthRange, shiftMonth, vietnamDay } from '@/features/interviews/calendar';
beforeEach(() => {
  getRecruiterMockStore().jobs = structuredClone(mockJobs); getRecruiterMockStore().sessions.clear();
  getRecruiterApplicationStore().splice(0, getRecruiterApplicationStore().length, ...structuredClone(mockCandidateDetails));
});
function setup() {
  const auth = createMockRecruiterSession(); const app = getRecruiterApplicationStore()[0];
  const id = '00000000-0000-4000-8000-000000000977';
  app.interviews = [{ id, applicationId: app.id, startTime: '2035-05-01T18:00:00Z', endTime: '2035-05-01T19:00:00Z', mode: 'offline', location: 'Văn phòng mẫu', status: 'scheduled', invitationStatus: 'accepted', interviewers: ['Người phỏng vấn mẫu'] }];
  const path = `recruiter/interviews/${id}`;
  const request = (target: string, method = 'GET', body?: unknown, csrf = auth.session.csrf) => handleMockRequest(new NextRequest('http://localhost/api/bff/' + target, { method, headers: { cookie: `talentai_mock_session=${auth.id}`, 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) }), target.split('?')[0]);
  return { auth, app, id, path, request };
}
it('handles Vietnam dates, leap months and month navigation without timezone drift', () => {
  expect(vietnamDay('2035-05-01T18:00:00Z')).toBe('2035-05-02');
  expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  expect(calendarDays('2026-06')[0]).toBe('2026-06-01');
  expect(calendarDays('2026-11').filter(Boolean)).toHaveLength(30);
});
it('lists scoped interviews with date/status filters and page metadata', async () => {
  const { request } = setup();
  const response = await request('recruiter/interviews?from=2035-05-02&to=2035-05-02&status=scheduled&pageSize=1');
  const page = interviewPageSchema.parse(await response.json());
  expect(page.meta).toMatchObject({ totalItems: 1, page: 1, pageSize: 1, totalPages: 1 });
  expect(page.items[0].candidate?.fullName).toBe(mockCandidateDetails[0].candidate.fullName);
  const empty = await request('recruiter/interviews?invitationStatus=declined');
  expect((await empty.json()).items).toHaveLength(0);
  expect((await request('recruiter/interviews?from=2035-05-03&to=2035-05-02')).status).toBe(422);
});
it('updates schedule, resets invitations, resends and cancels with a reason, preserving applicant status', async () => {
  const { request, app, path } = setup(); const before = app.status;
  const updated = await request(path, 'PATCH', { startTime: '2035-05-03T03:00:00Z', endTime: '2035-05-03T04:00:00Z', mode: 'online', meetingUrl: 'https://example.test/meeting' });
  expect(updated.status).toBe(200);
  expect(managedInterviewSchema.parse(await updated.json())).toMatchObject({ invitationStatus: 'pending', mode: 'online' });
  expect(app.interviews?.[0].location).toBeUndefined();
  expect((await request(path + '/send-invitation', 'POST')).status).toBe(200);
  expect((await request(path + '/cancel', 'POST', { reason: ' ' })).status).toBe(422);
  expect((await request(path + '/cancel', 'POST', { reason: 'Đổi kế hoạch tuyển dụng.' })).status).toBe(200);
  expect(app.interviews?.[0]).toMatchObject({ status: 'cancelled', cancelReason: 'Đổi kế hoạch tuyển dụng.' });
  expect((await request(path, 'PATCH', { location: 'Khác' })).status).toBe(422);
  expect((await request(path + '/send-invitation', 'POST')).status).toBe(403);
  expect(app.status).toBe(before);
});
it('rejects conflicting times, missing mode details, other companies and invalid CSRF', async () => {
  const { request, path, app, auth } = setup();
  app.interviews!.push({ ...app.interviews![0], id: '00000000-0000-4000-8000-000000000978', startTime: '2035-05-05T03:00:00Z', endTime: '2035-05-05T04:00:00Z' });
  expect((await request(path, 'PATCH', { startTime: '2035-05-05T03:30:00Z', endTime: '2035-05-05T04:30:00Z' })).status).toBe(409);
  expect((await request(path, 'PATCH', { mode: 'online' })).status).toBe(422);
  expect((await request(path, 'PATCH', {}, 'wrong')).status).toBe(403);
  auth.session.companyId = '00000000-0000-4000-8000-000000000999';
  expect((await request(path)).status).toBe(404);
  expect((await (await request('recruiter/interviews')).json()).items).toHaveLength(0);
});
