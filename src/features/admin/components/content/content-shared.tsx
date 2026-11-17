'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
export function ContentState({ pending, error, retry }: { pending: boolean; error: unknown; retry: () => unknown }) {
  const t = useTranslations('AdminContent');
  if (pending) return <div className="admin-skeleton" aria-busy="true" aria-label={t('loading')}><span /><span /><span /></div>;
  if (error) return <div className="admin-state" role="alert">{error instanceof ApiError && [401, 403].includes(error.status ?? 0) ? <><p>{t('session')}</p><Link href="/admin/login">{t('login')}</Link></> : <><p>{t('failed')}</p><Button variant="outline" onClick={retry}>{t('retry')}</Button></>}</div>;
  return null;
}
export function ContentPagination({ count, page, setPage }: { count: number; page: number; setPage: (page: number) => void }) {
  const t = useTranslations('AdminContent'), pages = Math.max(1, Math.ceil(count / 10));
  return <div className="admin-user-pagination"><span>{t('count', { count })}</span><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('previous')}</Button><span>{t('page', { page, pages })}</span><Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>{t('next')}</Button></div>;
}
