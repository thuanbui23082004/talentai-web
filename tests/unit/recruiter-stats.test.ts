import { beforeEach, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getRecruiterMockStore, createMockRecruiterSession } from '@/server/bff/recruiter-mock-store';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { buildFunnel, bucketDate, buildSeries } from '@/features/recruiter-stats/mock-statistics';
import { overviewSchema, funnelSchema, timeseriesSchema } from '@/features/recruiter-stats/schemas';
beforeEach(() => {
  getRecruiterMockStore().jobs = structuredClone(mockJobs); getRecruiterMockStore().sessions.clear();
  getRecruiterApplicationStore().splice(0, getRecruiterApplicationStore().length, ...structuredClone(mockCandidateDetails));
});
function setup() {
  const auth = createMockRecruiterSession();
  const request = (path: string) => handleMockRequest(new NextRequest('http://localhost/api/bff/' + path, { headers: { cookie: `talentai_mock_session=${auth.id}` } }), path.split('?')[0]);
  return { auth, request };
}
it('counts stage reach from history even after rejection and uses the previous stage as denominator', () => {
  const rejected = structuredClone(mockCandidateDetails[0]); rejected.status = 'rejected';
  rejected.statusHistory = [{ status: 'interview', changedAt: rejected.appliedAt, changedBy: 'recruiter' }];
  const hired = structuredClone(mockCandidateDetails[1]); hired.status = 'hired';
  const result = buildFunnel([rejected, hired]);
  expect(result.stages.map(stage => stage.count)).toEqual([2, 2, 2, 1]);
  expect(result.stages[3].conversionRate).toBe(0.5);
  expect(buildFunnel([]).stages[1].conversionRate).toBeUndefined();
});
it('includes configured rounds in order and does not treat scheduling as hiring', () => {
  const app = structuredClone(mockCandidateDetails[0]); app.status = 'interview'; app.currentRound = 'Vòng 2';
  const job = { ...mockJobs[0], hiringRounds: ['Vòng 1', 'Vòng 2'] };
  expect(buildFunnel([app], job).stages.map(stage => [stage.name, stage.count])).toEqual([['submitted', 1], ['reviewing', 1], ['Vòng 1', 1], ['Vòng 2', 1], ['hired', 0]]);
});
it('buckets in Vietnam time, starts weeks on Monday and includes zero buckets', () => {
  expect(bucketDate('2026-10-04T18:00:00Z', 'week')).toBe('2026-10-05');
  const points = buildSeries(['2026-10-01T18:00:00Z'], 'day', { from: '2026-10-01', to: '2026-10-03' });
  expect(points).toEqual([{ date: '2026-10-01', value: 0 }, { date: '2026-10-02', value: 1 }, { date: '2026-10-03', value: 0 }]);
});
it('serves contract-valid overview, funnel and series from the same application cohort', async () => {
  const { request } = setup();
  const query = '?from=2026-10-01&to=2026-10-27';
  const overview = overviewSchema.parse(await (await request('recruiter/stats/overview' + query)).json());
  expect(overview.totalApplications).toBe(mockCandidateDetails.length);
  const hired = mockCandidateDetails.filter(app => app.status === 'hired').length;
  expect(overview.hireRate).toBe(hired / mockCandidateDetails.length);
  const funnel = funnelSchema.parse(await (await request('recruiter/stats/funnel' + query)).json());
  expect(funnel.stages[0].count).toBe(overview.totalApplications);
  expect(funnel.stages.at(-1)?.count).toBe(hired);
  const series = timeseriesSchema.parse(await (await request('recruiter/stats/timeseries' + query + '&metric=applications&interval=day')).json());
  expect(series.points.reduce((sum, point) => sum + point.value, 0)).toBe(overview.totalApplications);
});
it('filters by job/date and rejects invalid dates and cross-company access', async () => {
  const { request, auth } = setup();
  const response = await request(`recruiter/stats/overview?jobId=${mockJobs[0].id}`);
  expect(overviewSchema.parse(await response.json()).totalApplications).toBe(mockCandidateDetails.filter(app => app.jobId === mockJobs[0].id).length);
  expect((await request('recruiter/stats/overview?from=2026-10-27&to=2026-10-01')).status).toBe(422);
  expect((await request('recruiter/stats/timeseries?metric=unknown')).status).toBe(422);
  auth.session.companyId = '00000000-0000-4000-8000-000000000999';
  expect((await request(`recruiter/stats/overview?jobId=${mockJobs[0].id}`)).status).toBe(403);
  expect(overviewSchema.parse(await (await request('recruiter/stats/overview')).json()).totalApplications).toBe(0);
});
