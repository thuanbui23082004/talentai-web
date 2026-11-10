'use client';
import { useQuery } from '@tanstack/react-query';
import { adminKeys } from '@/features/admin/query-keys';
import { getAdminOverview } from '@/features/admin/services';
import { getApplicationStats, getRecruitmentStats, getStatisticsSeries, getSystemMetrics } from '@/features/admin/services/statistics';
import type { Period } from '@/features/admin/schemas';
import type { StatisticsMetric, StatisticsInterval } from '@/features/admin/schemas/statistics';
export function useAdminStatistics(period: Period, metric: StatisticsMetric, interval: StatisticsInterval) {
  const overview = useQuery({ queryKey: adminKeys.overview({}), queryFn: ({ signal }) => getAdminOverview({}, signal), retry: false });
  const applications = useQuery({ queryKey: adminKeys.applicationStats(period), queryFn: ({ signal }) => getApplicationStats(period, signal), retry: false });
  const recruitment = useQuery({ queryKey: adminKeys.recruitmentStats(period), queryFn: ({ signal }) => getRecruitmentStats(period, signal), retry: false });
  const series = useQuery({ queryKey: adminKeys.statisticsSeries(period, metric, interval), queryFn: ({ signal }) => getStatisticsSeries(period, metric, interval, signal), retry: false });
  const system = useQuery({ queryKey: adminKeys.systemMetrics, queryFn: ({ signal }) => getSystemMetrics(signal), retry: false });
  return { overview, applications, recruitment, series, system };
}
