'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminKeys } from '@/features/admin/query-keys';
import { getPaymentDemo } from '@/features/admin/services/payment-demo';
import { paymentStatuses, reconciliationStates, paymentFiltersSchema, type PaymentFilters } from '@/features/admin/schemas/payment-demo';
import { emptyPaymentFilters, filterPayments } from '@/features/admin/payment-rules';
import { PaymentState, PaymentStatus } from '@/features/admin/components/payments-shared';
import { formatVND } from '@/lib/utils';

export function AdminPayments() {
  const t = useTranslations('AdminPayments'), f = useFormatter();
  const [filters, setFilters] = useState<PaymentFilters>(emptyPaymentFilters), [page, setPage] = useState(1);
  const query = useQuery({ queryKey: adminKeys.payments, queryFn: ({ signal }) => getPaymentDemo(signal), retry: false });
  const valid = paymentFiltersSchema.safeParse(filters).success, rows = filterPayments(query.data ?? [], filters);
  const pages = Math.max(1, Math.ceil(rows.length / 10)), current = Math.min(page, pages);
  function update<K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K]) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); }
  const summaries = [
    { key: 'paidTotal', value: formatVND(rows.filter(row => row.status === 'paid').reduce((sum, row) => sum + row.amount, 0)) },
    { key: 'pendingCount', value: f.number(rows.filter(row => row.status === 'pending').length) },
    { key: 'issueCount', value: f.number(rows.filter(row => ['failed', 'expired'].includes(row.status)).length) },
    { key: 'followUpCount', value: f.number(rows.filter(row => row.reconciliation === 'needs_follow_up').length) },
  ];
  return <div className="admin-users-page admin-payments-page">
    <div className="admin-users-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{t('refresh')}</Button></div>
    <div className="admin-user-filters admin-payment-filters"><label className="admin-user-search" htmlFor="payment-search">{t('search')}<Input id="payment-search" type="search" value={filters.search} placeholder={t('searchHint')} onChange={event => update('search', event.target.value)} /></label>
      <label>{t('status')}<select aria-label={t('status')} value={filters.status} onChange={event => update('status', event.target.value as PaymentFilters['status'])}><option value="">{t('all')}</option>{paymentStatuses.map(key => <option key={key} value={key}>{t(key)}</option>)}</select></label>
      <label>{t('reconciliation')}<select aria-label={t('reconciliation')} value={filters.reconciliation} onChange={event => update('reconciliation', event.target.value as PaymentFilters['reconciliation'])}><option value="">{t('all')}</option>{reconciliationStates.map(key => <option key={key} value={key}>{t(key)}</option>)}</select></label>
      <label>{t('from')}<Input type="date" value={filters.from} onChange={event => update('from', event.target.value)} /></label><label>{t('to')}<Input type="date" aria-invalid={!valid} aria-describedby={!valid ? 'payment-date-error' : undefined} value={filters.to} onChange={event => update('to', event.target.value)} /></label><Button variant="ghost" onClick={() => { setFilters(emptyPaymentFilters); setPage(1); }}>{t('clear')}</Button>
    </div>
    {!valid && <p id="payment-date-error" role="alert" className="admin-error">{t('dateOrder')}</p>}
    <PaymentState pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.error && valid && <><div><div className="admin-report-summary admin-payment-summary">{summaries.map(item => <div key={item.key}><span>{t(item.key)}</span><strong>{item.value}</strong></div>)}</div><p className="admin-content-muted admin-payment-summary-hint">{t('summaryHint')}</p></div>
      {rows.length ? <div className="admin-table-scroll"><table className="admin-users-table admin-payments-table"><thead><tr>{['order', 'buyer', 'plan', 'amount', 'status', 'reconciliation', 'created', 'actions'].map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 10, current * 10).map(row => <tr key={row.id}><td><Link className="admin-user-name" href={`/admin/payments/${row.id}`}>{row.orderCode}</Link><small className="admin-content-aliases">{row.transactionCode || t('absent')}</small></td><td><strong>{row.buyer}</strong><small className="admin-content-aliases">{row.company}</small></td><td>{row.plan}</td><td className="admin-payment-amount">{formatVND(row.amount)}</td><td><PaymentStatus value={row.status} /></td><td><PaymentStatus value={row.reconciliation} /></td><td>{f.dateTime(new Date(row.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td><td><Link className="admin-text-link" href={`/admin/payments/${row.id}`}>{t('view')}</Link></td></tr>)}</tbody></table></div> : <div className="admin-state"><p>{t('empty')}</p><p>{t('emptyHint')}</p></div>}
      <div className="admin-user-pagination"><span>{t('count', { count: rows.length })}</span><Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>{t('previous')}</Button><span>{t('page', { page: current, pages })}</span><Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>{t('next')}</Button></div>
    </>}
  </div>;
}
