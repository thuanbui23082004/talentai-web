'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { adminKeys } from '@/features/admin/query-keys';
import { getPaymentDemoDetail, savePaymentDemoReview } from '@/features/admin/services/payment-demo';
import { reconciliationSchema, type PaymentDemoRecord, type ReconciliationInput } from '@/features/admin/schemas/payment-demo';
import { canReconcilePayment } from '@/features/admin/payment-rules';
import { PaymentState, PaymentStatus } from '@/features/admin/components/payments-shared';
import { paymentErrorKey } from '@/features/admin/errors';
import { formatVND } from '@/lib/utils';

export function AdminPaymentDetail({ paymentId }: { paymentId: string }) {
  const t = useTranslations('AdminPayments'), f = useFormatter(), cache = useQueryClient();
  const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: adminKeys.payment(paymentId), queryFn: ({ signal }) => getPaymentDemoDetail(paymentId, signal), retry: false });
  const mutation = useMutation({ mutationFn: savePaymentDemoReview, onMutate: () => setSaved(false), onSuccess: async data => { cache.setQueryData(adminKeys.payment(paymentId), data); setSaved(true); await cache.invalidateQueries({ queryKey: ['admin'] }); } });
  const payment = query.data;
  return <div className="admin-users-page admin-payments-page"><Link className="admin-text-link" href="/admin/payments"><ArrowLeft size={16} />{t('back')}</Link>
    <div className="admin-users-heading"><div><h1>{t('detail')}</h1><p>{payment?.orderCode}</p></div><Button variant="outline" disabled={query.isFetching || mutation.isPending} onClick={() => { mutation.reset(); void query.refetch(); }}><RefreshCw size={16} />{t('refresh')}</Button></div>
    <PaymentState pending={query.isPending} error={query.error} retry={query.refetch} />
    {saved && <p role="status" className="admin-user-notice">{t('saved')}</p>}
    {payment && !query.error && <>
      <section className="admin-user-info admin-report-info"><h2>{t('orderInfo')}</h2><dl className="admin-user-fields">{[['order', payment.orderCode], ['buyerName', payment.buyer], ['company', payment.company], ['plan', payment.plan], ['amount', formatVND(payment.amount)], ['created', f.dateTime(new Date(payment.createdAt), { dateStyle: 'medium', timeStyle: 'short' })]].map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd>{value}</dd></div>)}</dl></section>
      <section className="admin-user-info admin-report-info"><h2>{t('transactionInfo')}</h2><dl className="admin-user-fields"><div><dt>{t('status')}</dt><dd><PaymentStatus value={payment.status} /></dd></div><div><dt>{t('reconciliation')}</dt><dd><PaymentStatus value={payment.reconciliation} /></dd></div><div><dt>{t('transaction')}</dt><dd>{payment.transactionCode || t('absent')}</dd></div><div><dt>{t('method')}</dt><dd>{t(payment.method)}</dd></div><div><dt>{t('paidAt')}</dt><dd>{payment.paidAt ? f.dateTime(new Date(payment.paidAt), { dateStyle: 'medium', timeStyle: 'short' }) : t('absent')}</dd></div></dl>
        {payment.issue && <div className="admin-job-moderation-note"><h3>{t('issue')}</h3><p>{t(payment.issue === 'expired' ? 'issueExpired' : payment.issue === 'cancelled' ? 'issueCancelled' : payment.issue)}</p></div>}{payment.status === 'pending' && <p className="admin-content-muted">{t('pendingHint')}</p>}
      </section>
      {canReconcilePayment(payment) ? <ReconciliationForm key={`${payment.id}-${payment.version}`} payment={payment} busy={mutation.isPending} error={mutation.error} submit={value => mutation.mutate(value)} /> : <p className="admin-content-muted">{t('readOnly')}</p>}
      <section className="admin-user-history admin-report-history"><h2>{t('history')}</h2>{payment.history.length ? <ol>{payment.history.map(entry => <li key={entry.id}><strong>{t(entry.outcome)}</strong><p>{entry.actorName} · {f.dateTime(new Date(entry.at), { dateStyle: 'medium', timeStyle: 'short' })}</p><p className="admin-content-text">{entry.note}</p></li>)}</ol> : <p>{t('noHistory')}</p>}</section>
    </>}
  </div>;
}
function ReconciliationForm({ payment, busy, error, submit }: { payment: PaymentDemoRecord; busy: boolean; error: unknown; submit: (input: ReconciliationInput) => void }) {
  const t = useTranslations('AdminPayments'), [confirmation, setConfirmation] = useState<ReconciliationInput | null>(null);
  const form = useForm<ReconciliationInput>({ resolver: zodResolver(reconciliationSchema), mode: 'onBlur', defaultValues: { paymentId: payment.id, version: payment.version, outcome: 'needs_follow_up', note: '' } });
  const errorKey = paymentErrorKey(error), stale = errorKey === 'CONFLICT' || errorKey === 'INVALID_STATE';
  return <form className="admin-access-panel admin-content-form" aria-label={t('review')} onSubmit={form.handleSubmit(setConfirmation)}><h2>{t('review')}</h2><p>{t('reviewHint')}</p>
    <fieldset disabled={busy || Boolean(confirmation)}><label>{t('outcome')}<select aria-label={t('outcome')} {...form.register('outcome')}><option value="needs_follow_up">{t('followUpOption')}</option><option value="verified">{t('verifiedOption')}</option></select></label>
      <label htmlFor="payment-review-note">{t('note')}<Textarea id="payment-review-note" maxLength={1000} rows={4} aria-invalid={Boolean(form.formState.errors.note)} aria-describedby={form.formState.errors.note ? 'payment-note-error' : undefined} {...form.register('note')} /></label>
      {form.formState.errors.note && <p id="payment-note-error" className="admin-error" role="alert">{t(form.formState.errors.note.message === 'noteLong' ? 'noteLong' : 'noteRequired')}</p>}<Button type="submit">{t('continue')}</Button>
    </fieldset>
    {confirmation && <div className="admin-confirm-details" role="region" aria-label={t('confirm')}><h3>{t('confirm')}</h3><p>{t('confirmHint')}</p><dl className="admin-user-fields"><div><dt>{t('order')}</dt><dd>{payment.orderCode}</dd></div><div><dt>{t('status')}</dt><dd>{t(payment.status)}</dd></div><div><dt>{t('outcome')}</dt><dd>{t(confirmation.outcome)}</dd></div></dl><p className="admin-content-text">{confirmation.note}</p><div className="admin-access-buttons"><Button type="button" disabled={busy || stale} onClick={() => submit(confirmation)}>{t('confirm')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>{t('edit')}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => { setConfirmation(null); form.reset(); }}>{t('cancel')}</Button></div></div>}
    {Boolean(error) && <div role="alert" className="admin-error"><p>{t(`errors.${errorKey}`)}</p>{errorKey === 'UNAUTHENTICATED' && <Link className="admin-text-link" href="/admin/login">{t('login')}</Link>}</div>}
  </form>;
}
