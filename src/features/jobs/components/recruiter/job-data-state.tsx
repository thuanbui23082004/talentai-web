'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { JobRequestError } from '@/features/jobs/errors';
export function JobDataState({ loading, error, onRetry }: { loading?: boolean; error?: unknown; onRetry?: () => void }) {
  const t = useTranslations('JobForm');
  if (loading) return <div className="job-data-skeleton" aria-busy="true"><span /><span /><span /></div>;
  return <section className="recruiter-panel empty-state" role="alert"><p>{t(error instanceof JobRequestError ? `errors.${error.messageKey}` : 'errors.requestFailed')}</p>{onRetry && <Button variant="outline" onClick={onRetry}>{t('retry')}</Button>}</section>;
}
