'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { ManagedJob } from '@/features/admin/schemas/jobs';
export function JobState({ pending, error, retry }: { pending: boolean; error: unknown; retry: () => unknown }) {
  const t = useTranslations('AdminJobs'); const a = useTranslations('Admin');
  if (pending) return <div className="admin-skeleton" aria-busy="true" aria-label={t('loading')}><span /><span /><span /></div>;
  if (error) return <div className="admin-state" role="alert">{error instanceof ApiError && [401, 403].includes(error.status ?? 0) ? <><p>{a('sessionExpired')}</p><Link href="/admin/login">{a('backLogin')}</Link></> : <><p>{t(error instanceof ApiError && error.status === 404 ? 'notFound' : 'failed')}</p><Button variant="outline" onClick={retry}>{t('retry')}</Button></>}</div>;
  return null;
}
export function AdminJobBadge({ status }: { status: ManagedJob['status'] }) {
  const t = useTranslations('AdminJobs');
  return <span className={`admin-badge${status === 'rejected' || status === 'locked' ? ' failed' : ''}`}>{t(`statuses.${status}`)}</span>;
}
