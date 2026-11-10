import { expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { handleAdminRequest } from '@/server/bff/admin-handler';
import { statisticsBucket } from '@/server/bff/admin-statistics-handler';
import { statisticsIndustries } from '@/mocks/fixtures/admin-statistics';
import { applicationStatsSchema, recruitmentStatsSchema, systemMetricsSchema, statisticsPeriodFormSchema } from '@/features/admin/schemas/statistics';
import { statisticsShare } from '@/features/admin/statistics-rules';
import { handleAdminMockRequest } from '@/server/bff/admin-adapter';
import { mockAdmin, mockAdminPassword } from '@/mocks/fixtures/admin';
const session = { role: 'admin' as const, csrf: 'statistics-test' };
test('admin mock login supplies an isolated session for statistics', async () => {
  const response = await handleAdminMockRequest(new NextRequest('http://localhost/api/bff/auth/login', { method: 'POST', headers: { 'X-TalentAI-Workspace': 'admin' }, body: JSON.stringify({ email: mockAdmin.email, password: mockAdminPassword }) }), 'auth/login');
  expect(response.status).toBe(200);
});
async function call(path: string, scenario?: string, method = 'GET') {
  const response = await handleAdminRequest(new NextRequest(`http://localhost/api/bff/${path}`, { method, headers: scenario ? { 'x-mock-scenario': scenario } : {} }), path.split('?')[0], session);
  if (!response) throw new Error('Missing statistics handler');
  return response;
}
test('day/week/month buckets preserve sums and clip days before grouping', async () => {
  expect(statisticsBucket('2026-11-01', 'week')).toBe('2026-10-26');
  const daily = await (await call('admin/stats/timeseries?metric=applications')).json();
  expect(daily.points.map((row: { value: number }) => row.value)).toEqual([92, 115, 104, 148, 132]);
  const weekly = await (await call('admin/stats/timeseries?metric=applications&interval=week&from=2026-11-02&to=2026-11-04')).json();
  expect(weekly.points).toEqual([{ date: '2026-11-02', value: 367 }]);
  const monthly = await (await call('admin/stats/timeseries?metric=new_companies&interval=month')).json();
  expect(monthly.points).toEqual([{ date: '2026-11-01', value: 23 }]);
  for (const metric of ['logins', 'ai_tasks', 'jobs_posted', 'new_users']) expect((await call(`admin/stats/timeseries?metric=${metric}`)).status).toBe(200);
});
test('application totals reconcile with status, industry and recruitment numbers', async () => {
  const period = 'from=2026-11-02&to=2026-11-04';
  const applications = applicationStatsSchema.parse(await (await call(`admin/stats/applications?${period}`)).json());
  const recruitment = recruitmentStatsSchema.parse(await (await call(`admin/stats/recruitment?${period}`)).json());
  expect(applications.total).toBe(367);
  expect(Object.values(applications.byStatus ?? {}).reduce((sum, count) => sum + count, 0)).toBe(applications.total);
  expect(applications.byIndustry?.reduce((sum, row) => sum + (row.count ?? 0), 0)).toBe(applications.total);
  expect(recruitment.byIndustry?.reduce((sum, row) => sum + (row.applications ?? 0), 0)).toBe(applications.total);
  expect(recruitment.byIndustry?.reduce((sum, row) => sum + (row.hires ?? 0), 0)).toBe(applications.byStatus?.hired);
  const industry = applicationStatsSchema.parse(await (await call(`admin/stats/applications?${period}&industryId=${statisticsIndustries[0].id}`)).json());
  expect(industry.byIndustry).toHaveLength(1); expect(industry.total).toBe(applications.byIndustry?.[0].count);
});
test('empty periods and mock empty scenarios never fabricate metrics', async () => {
  expect((await (await call('admin/stats/applications?from=2099-01-01')).json()).total).toBe(0);
  expect(await (await call('admin/stats/recruitment?from=2099-01-01')).json()).toEqual({ byIndustry: [], topCompanies: [] });
  expect((await (await call('admin/stats/timeseries?metric=logins', 'empty')).json()).points).toEqual([]);
  expect(await (await call('admin/stats/system-metrics', 'empty')).json()).toEqual({});
  expect(systemMetricsSchema.parse(await (await call('admin/stats/system-metrics')).json()).collectedAt).toBeTruthy();
});
test('invalid ranges/metrics/industry are rejected and all stats enforce admin access', async () => {
  for (const path of ['admin/stats/applications?from=2026-11-04&to=2026-11-02', 'admin/stats/recruitment?from=invalid', 'admin/stats/timeseries?metric=unknown', 'admin/stats/timeseries?metric=applications&interval=year', 'admin/stats/applications?industryId=invalid']) expect((await call(path)).status).toBe(422);
  for (const path of ['applications', 'recruitment', 'system-metrics', 'timeseries?metric=applications']) {
    const route = `admin/stats/${path}`, request = new NextRequest(`http://localhost/api/bff/${route}`);
    expect((await handleAdminRequest(request, route.split('?')[0]))?.status).toBe(401);
    expect((await handleAdminRequest(request, route.split('?')[0], { role: 'recruiter', csrf: 'x' }))?.status).toBe(403);
  }
  expect((await call('admin/stats/applications', undefined, 'POST')).status).toBe(405);
});
test('shares handle zero totals and schemas reject broken counts while preserving missing values', () => {
  expect(statisticsPeriodFormSchema.safeParse({ from: '', to: '' }).success).toBe(true);
  expect(statisticsPeriodFormSchema.safeParse({ from: '2026-11-07', to: '2026-11-04' }).success).toBe(false);
  expect(statisticsShare(0, 0)).toBe(0); expect(statisticsShare(1, 4)).toBe(25); expect(statisticsShare(8, 4)).toBe(100);
  expect(applicationStatsSchema.parse({})).toEqual({});
  expect(applicationStatsSchema.safeParse({ total: -1 }).success).toBe(false);
  expect(systemMetricsSchema.safeParse({ uptimePercent: 120 }).success).toBe(false);
});
