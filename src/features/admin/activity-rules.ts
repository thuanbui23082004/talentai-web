import { z } from 'zod';
import { activityFiltersSchema, type ActivityLog, type ActivityFilters } from '@/features/admin/schemas/activity-logs';
export const emptyActivityFilters: ActivityFilters = { search: '', actor: '', action: '', target: '', result: '', from: '', to: '' };
export const activityActionKeys: Record<string, string> = {
  'anomaly.review': 'anomalyReview', 'anomaly.dismiss': 'anomalyDismiss',
  'company.verify': 'companyVerify', 'company.reject': 'companyReject', 'company.suspend': 'companySuspend', 'company.restore': 'companyRestore',
  'user.lock': 'userLock', 'user.unlock': 'userUnlock', 'user.warn': 'userWarn',
  'job.approve': 'jobApprove', 'job.reject': 'jobReject', 'job.hide': 'jobHide', 'job.lock': 'jobLock', 'job.delete': 'jobDelete',
  'catalog.create': 'catalogCreate', 'catalog.update': 'catalogUpdate', 'catalog.delete': 'catalogDelete',
  'report.start-review': 'reportReview', 'report.resolve': 'reportResolve', 'payment.reconcile': 'paymentReconcile',
};
export function activityActionKey(action: string) { return Object.hasOwn(activityActionKeys, action) ? activityActionKeys[action] : 'other'; }
export function activityDay(value: string) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
export function filterActivityLogs(items: ActivityLog[], filters: ActivityFilters) {
  if (!activityFiltersSchema.safeParse(filters).success) return [];
  const needle = filters.search.trim().toLocaleLowerCase('vi');
  return items.filter(row => row.actorRole === 'admin' && (!filters.actor || row.actorId === filters.actor) && (!filters.action || row.action === filters.action) && (!filters.target || row.targetType === filters.target) && (!filters.result || row.result === filters.result) &&
    (!filters.from || activityDay(row.occurredAt) >= filters.from) && (!filters.to || activityDay(row.occurredAt) <= filters.to) &&
    (!needle || [row.actorName, row.targetId, row.metadata?.reason, row.metadata?.note, row.metadata?.orderCode].some(value => value?.toLocaleLowerCase('vi').includes(needle))))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
export function activityTargetLink(log: ActivityLog) {
  if (!log.targetId || !z.uuid().safeParse(log.targetId).success) return null;
  const routes = new Map<string, string>([['user', 'users'], ['company', 'companies'], ['job', 'jobs'], ['report', 'reports'], ['payment', 'payments']]);
  if (log.targetType === 'catalog') return '/admin/catalog';
  if (log.targetType === 'anomaly') return '/admin/monitoring';
  const route = log.targetType ? routes.get(log.targetType) : undefined;
  return route ? `/admin/${route}/${log.targetId}` : null;
}
