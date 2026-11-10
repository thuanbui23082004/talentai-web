import { z } from 'zod';
import { activityDay } from '@/features/admin/activity-rules';
import type { SystemLog, Anomaly } from '@/features/admin/schemas/monitoring';
export const monitoringPeriodSchema = z.object({ from: z.union([z.literal(''), z.iso.date()]), to: z.union([z.literal(''), z.iso.date()]) }).refine(value => !value.from || !value.to || value.from <= value.to);
export function filterSystemLogs(rows: SystemLog[], filters: { search: string; level: string; source: string; from: string; to: string }) {
  if (!monitoringPeriodSchema.safeParse(filters).success) return [];
  const q = filters.search.trim().toLocaleLowerCase('vi');
  return rows.filter(row => (!filters.level || row.level === filters.level) && (!filters.source || row.source === filters.source) && (!filters.from || activityDay(row.occurredAt) >= filters.from) && (!filters.to || activityDay(row.occurredAt) <= filters.to) && (!q || [row.message, row.source, row.requestId].some(value => value?.toLocaleLowerCase('vi').includes(q)))).sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
export function filterAnomalies(rows: Anomaly[], filters: { search: string; severity: string; status: string; type: string }) {
  const q = filters.search.trim().toLocaleLowerCase('vi');
  return rows.filter(row => (!filters.severity || row.severity === filters.severity) && (!filters.status || row.status === filters.status) && (!filters.type || row.type === filters.type) && (!q || [row.description, row.id, row.userId].some(value => value?.toLocaleLowerCase('vi').includes(q)))).sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt));
}
