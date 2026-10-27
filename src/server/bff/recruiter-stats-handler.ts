import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterMockStore, getDeletedJobIds } from '@/server/bff/recruiter-mock-store';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { statsQuerySchema, seriesQuerySchema } from '@/features/recruiter-stats/schemas';
import { withinRange, buildFunnel, buildSeries } from '@/features/recruiter-stats/mock-statistics';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
export function handleRecruiterStats(request: NextRequest, path: string, companyId?: string) {
  const match = /^recruiter\/stats\/(overview|funnel|timeseries)$/.exec(path);
  if (!match) return;
  if (request.method !== 'GET') return problem(405, 'BAD_REQUEST');
  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = match[1] === 'timeseries' ? seriesQuerySchema.safeParse(raw) : statsQuerySchema.safeParse(raw);
  if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
  const q = parsed.data;
  const ownedJobs = getRecruiterMockStore().jobs.filter(job => job.company.id === companyId && !getDeletedJobIds().has(job.id));
  if (q.jobId && !ownedJobs.some(job => job.id === q.jobId)) return problem(403, 'FORBIDDEN');
  const empty = request.headers.get('x-mock-scenario') === 'empty';
  const jobs = empty ? [] : ownedJobs.filter(job => !q.jobId || job.id === q.jobId);
  const allApps = empty ? [] : getRecruiterApplicationStore().filter(app => jobs.some(job => job.id === app.jobId));
  const apps = allApps.filter(app => withinRange(app.appliedAt, q));
  const interviews = allApps.flatMap(app => app.interviews ?? []).filter(item => withinRange(item.startTime, q));
  const response = (value: unknown) => NextResponse.json(value, { headers: { 'Cache-Control': 'private, no-store' } });
  if (match[1] === 'funnel') return response(buildFunnel(apps, q.jobId ? jobs.find(job => job.id === q.jobId) : undefined));
  if (match[1] === 'timeseries') {
    const series = seriesQuerySchema.parse(raw);
    const dates = series.metric === 'jobs_posted' ? jobs.flatMap(job => job.createdAt ? [job.createdAt] : []) : series.metric === 'applications' ? allApps.map(app => app.appliedAt) : series.metric === 'interviews' ? allApps.flatMap(app => app.interviews ?? []).filter(item => item.status !== 'cancelled').map(item => item.startTime) : allApps.flatMap(app => app.statusHistory?.filter(item => item.status === 'hired').slice(0, 1).map(item => item.changedAt) ?? []);
    return response({ metric: series.metric, interval: series.interval, from: series.from, to: series.to, points: buildSeries(dates, series.interval, q) });
  }
  const countBy = (values: string[]) => values.reduce<Record<string, number>>((counts, value) => { counts[value] = (counts[value] ?? 0) + 1; return counts; }, {});
  const scores = apps.flatMap(app => app.matchScore === undefined ? [] : [app.matchScore]);
  return response({ jobsByStatus: countBy(jobs.filter(job => job.createdAt && withinRange(job.createdAt, q)).map(job => job.status)), totalApplications: apps.length, applicationsByStatus: countBy(apps.map(app => app.status)), upcomingInterviews: interviews.filter(item => item.status === 'scheduled' && new Date(item.startTime).getTime() >= Date.now()).length, completedInterviews: interviews.filter(item => item.status === 'completed').length, hireRate: apps.length ? apps.filter(app => app.status === 'hired').length / apps.length : 0, ...(scores.length ? { averageMatchScore: scores.reduce((a, b) => a + b, 0) / scores.length } : {}), topJobs: jobs.map(job => ({ jobId: job.id, title: job.title, applications: apps.filter(app => app.jobId === job.id).length, hired: apps.filter(app => app.jobId === job.id && app.status === 'hired').length })).filter(job => job.applications > 0).sort((a, b) => b.applications - a.applications).slice(0, 5) });
}
