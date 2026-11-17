'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { paymentErrorKey } from '@/features/admin/errors';
import type { PaymentDemoRecord } from '@/features/admin/schemas/payment-demo';
export function PaymentState({ pending, error, retry }: { pending: boolean; error: unknown; retry: () => unknown }) {
  const t = useTranslations('AdminPayments');
  if (pending) return <div className="admin-skeleton" aria-busy="true" aria-label={t('loading')}><span /><span /><span /></div>;
  if (!error) return null;
  const key = paymentErrorKey(error);
  return <div className="admin-state" role="alert"><p>{t(`errors.${key}`)}</p>{key === 'UNAUTHENTICATED' ? <Link className="admin-text-link" href="/admin/login">{t('login')}</Link> : <Button variant="outline" onClick={retry}>{t('retry')}</Button>}</div>;
}
export function PaymentStatus({ value }: { value: PaymentDemoRecord['status'] | PaymentDemoRecord['reconciliation'] }) {
  const t = useTranslations('AdminPayments');
  return <span className={`admin-badge${['failed', 'expired', 'needs_follow_up'].includes(value) ? ' failed' : ''}`}>{t(value)}</span>;
}
