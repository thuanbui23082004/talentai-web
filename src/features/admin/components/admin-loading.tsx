'use client';
import { useTranslations } from 'next-intl';
export function AdminLoading() {
  const t = useTranslations('Admin');
  return <div className="admin-route-loading"><div className="admin-skeleton" aria-label={t('loading')} aria-busy="true"><span /><span /><span /></div></div>;
}
