import type { components } from '@/lib/api/generated/schema';
import { adminDailyActivity } from '@/mocks/fixtures/admin';
export const adminStatisticsDays = adminDailyActivity.map((row, index) => ({ ...row, companies: [3, 5, 4, 6, 5][index], logins: [360, 420, 390, 480, 450][index], aiTasks: [36, 45, 41, 58, 52][index] }));
export const statisticsIndustries: components['schemas']['CatalogRef'][] = [
  { id: '00000000-0000-4000-8000-000000018001', name: 'Công nghệ thông tin' },
  { id: '00000000-0000-4000-8000-000000018002', name: 'Kinh doanh và bán hàng' },
  { id: '00000000-0000-4000-8000-000000018003', name: 'Marketing và truyền thông' },
];
export const statisticsCompanies: components['schemas']['CompanySummary'][] = [
  { id: '00000000-0000-4000-8000-000000018101', name: 'Công ty Công nghệ Ánh Sao' },
  { id: '00000000-0000-4000-8000-000000018102', name: 'Công ty Thương mại Bình Minh' },
  { id: '00000000-0000-4000-8000-000000018103', name: 'Công ty Truyền thông Mây Việt' },
];
// Synthetic snapshot; rates in this mock are percentage points, not ratios.
export const mockSystemMetrics: components['schemas']['SystemMetrics'] = { uptimePercent: 99.96, apiErrorRate: 0.04, p95LatencyMs: 240, concurrentUsers: 128, aiQueueDepth: 4, aiAverageProcessingMs: 2800, lastBackupAt: '2026-11-05T00:00:00Z', collectedAt: '2026-11-05T10:00:00Z' };
