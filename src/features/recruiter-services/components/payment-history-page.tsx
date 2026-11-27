'use client';

import Link from 'next/link';
import { ArrowRight, ReceiptText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';
import { ServiceFrame } from './service-frame';

export function PaymentHistoryPage() {
  const t = useTranslations('RecruiterServices');

  return <ServiceFrame active="payment-history">
    <header className="service-page-heading">
      <h1>{t('paymentHistoryTitle')}</h1>
      <p>{t('paymentHistorySubtitle')}</p>
    </header>
    <section aria-label={t('paymentHistoryTitle')}>
      <EmptyState
        headingAs="h2"
        icon={<ReceiptText aria-hidden="true" />}
        title={t('paymentHistoryEmptyTitle')}
        description={t('paymentHistoryEmptyDescription')}
        action={<Link className="service-primary-link" href="/recruiter/pricing">{t('paymentHistoryExplorePlans')}<ArrowRight size={16} aria-hidden="true" /></Link>}
      />
    </section>
  </ServiceFrame>;
}
