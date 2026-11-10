import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { periodSchema, statisticsSeriesQuerySchema } from '@/features/admin';
import { adminStatisticsDays, statisticsIndustries, statisticsCompanies, mockSystemMetrics } from '@/mocks/fixtures/admin-statistics';
const response = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
function split(total: number) { const first = Math.floor(total / 2), second = Math.floor(total / 3); return [first, second, total - first - second]; }
export function statisticsBucket(date: string, interval: 'day' | 'week' | 'month') {
  if (interval === 'month') return `${date.slice(0, 7)}-01`;
  if (interval === 'day') return date;
  const day = new Date(`${date}T00:00:00Z`); day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7); return day.toISOString().slice(0, 10);
}
// Dispatch only after the shared admin session/role guard.
export function handleAdminStatistics(request: NextRequest, path: string) {
  if (!['admin/stats/timeseries', 'admin/stats/applications', 'admin/stats/recruitment', 'admin/stats/system-metrics'].includes(path)) return;
  if (request.method !== 'GET') return response({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
  const raw = Object.fromEntries(request.nextUrl.searchParams), period = periodSchema.safeParse(raw);
  if (!period.success || (raw.industryId !== undefined && !z.uuid().safeParse(raw.industryId).success)) return response({ error: { code: 'VALIDATION_FAILED' } }, 422);
  const empty = request.headers.get('x-mock-scenario') === 'empty';
  const rows = empty ? [] : adminStatisticsDays.filter(row => (!period.data.from || row.date >= period.data.from) && (!period.data.to || row.date <= period.data.to));
  if (path === 'admin/stats/system-metrics') return response(empty ? {} : mockSystemMetrics);
  if (path === 'admin/stats/timeseries') {
    const query = statisticsSeriesQuerySchema.safeParse(raw); if (!query.success) return response({ error: { code: 'VALIDATION_FAILED' } }, 422);
    const { metric, interval } = query.data, buckets = new Map<string, number>();
    for (const row of rows) { const date = statisticsBucket(row.date, interval); const value = metric === 'new_users' ? row.candidates + row.recruiters : metric === 'new_companies' ? row.companies : metric === 'jobs_posted' ? row.jobs : metric === 'applications' ? row.applications : metric === 'logins' ? row.logins : row.aiTasks; buckets.set(date, (buckets.get(date) ?? 0) + value); }
    return response({ metric, interval, ...period.data, points: [...buckets].map(([date, value]) => ({ date, value })) } satisfies components['schemas']['TimeSeries']);
  }
  const perIndustry = statisticsIndustries.map((industry, index) => ({ industry, jobs: rows.reduce((sum, row) => sum + split(row.jobs)[index], 0), applications: rows.reduce((sum, row) => sum + split(row.applications)[index], 0), hires: rows.reduce((sum, row) => sum + Math.floor(split(row.applications)[index] / 10), 0) }));
  if (path === 'admin/stats/applications') {
    const selected = raw.industryId ? perIndustry.filter(row => row.industry.id === raw.industryId) : perIndustry;
    const total = selected.reduce((sum, row) => sum + row.applications, 0), hired = selected.reduce((sum, row) => sum + row.hires, 0), part = Math.floor(total / 6);
    return response({ total, byStatus: { submitted: total - part * 4 - hired, reviewing: part, interview: part, rejected: part, withdrawn: part, hired }, byIndustry: selected.filter(row => row.applications > 0).map(row => ({ industry: row.industry, count: row.applications })) } satisfies components['schemas']['ApplicationStats']);
  }
  return response({ byIndustry: perIndustry.filter(row => row.jobs || row.applications), topCompanies: rows.length ? statisticsCompanies.map((company, index) => ({ company, jobs: perIndustry[index].jobs, applications: perIndustry[index].applications, hires: perIndustry[index].hires })) : [], ...(rows.length ? { averageTimeToHireDays: 14.5 } : {}) } satisfies components['schemas']['RecruitmentStats']);
}
