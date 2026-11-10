import type { Period, Metric } from '@/features/admin/schemas';
import type { StatisticsMetric, StatisticsInterval } from '@/features/admin/schemas/statistics';
export const adminKeys = {
  applicationStats: (period: Period) => ['admin', 'application-stats', period] as const,
  recruitmentStats: (period: Period) => ['admin', 'recruitment-stats', period] as const,
  systemMetrics: ['admin', 'system-metrics'] as const,
  statisticsSeries: (period: Period, metric: StatisticsMetric, interval: StatisticsInterval) => ['admin', 'statistics-series', period, metric, interval] as const,
  systemLogs: ['admin', 'system-logs'] as const,
  anomalies: ['admin', 'anomalies'] as const,
  activityLogs: ['admin', 'activity-logs'] as const,
  payments: ['admin', 'payments'] as const,
  payment: (id: string) => ['admin', 'payment', id] as const,
  jobs: ['admin', 'jobs'] as const,
  job: (id: string) => ['admin', 'job', id] as const,
  companies: ['admin', 'companies'] as const,
  company: (id: string) => ['admin', 'company', id] as const,
  companyDocument: (companyId: string, documentId: string) => ['admin', 'company-document', companyId, documentId] as const,
  users: ['admin', 'users'] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  userActivity: (id: string) => ['admin', 'user-activity', id] as const,
  overview: (period: Period) => ['admin', 'overview', period] as const,
  series: (period: Period, metric: Metric) => ['admin', 'series', period, metric] as const,
  logs: (period: Period) => ['admin', 'logs', period] as const,
};
