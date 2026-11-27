'use client';

import Link from 'next/link';
import { ArrowRight, ReceiptText, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';
import { ServiceFrame } from './service-frame';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedbackState } from '@/components/shared/feedback-state';
import { formatDate, formatVND } from '@/lib/utils';
import { usePaymentHistory } from '../hooks/use-payment-history';
import { useSubscriptionPlans } from '../hooks/use-subscription-plans';
import { paymentHistoryStates, paymentProviderLabels } from '../payment-presentation';
import type { SubscriptionOrderState } from '../types';

export function PaymentHistoryPage({ page = 1, status }: { page?: number; status?: SubscriptionOrderState }) {
  const t = useTranslations('RecruiterServices');
  const router = useRouter();
  const query = usePaymentHistory({ page, pageSize: 10, status });
  const plans = useSubscriptionPlans();
  const go = (nextPage: number, nextStatus = status) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextStatus) params.set('status', nextStatus);
    router.push(`/recruiter/payment-history${params.size ? `?${params}` : ''}`, { scroll: false });
  };
  const reset = () => router.push('/recruiter/payment-history', { scroll: false });

  return <ServiceFrame active="payment-history">
    <header className="service-page-heading">
      <h1>{t('paymentHistoryTitle')}</h1>
      <p>{t('paymentHistorySubtitle')}</p>
    </header>
    <section aria-label={t('paymentHistoryTitle')} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="w-full sm:w-64"><label id="payment-status-label" className="mb-2 block text-sm font-medium">Trạng thái thanh toán</label><Select aria-labelledby="payment-status-label" value={status ?? 'ALL'} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, ...Object.entries(paymentHistoryStates).map(([value, label]) => ({ value, label }))]} onValueChange={value => { if (value === 'ALL') reset(); else if (value && Object.hasOwn(paymentHistoryStates, value)) go(1, value as SubscriptionOrderState); }} /></div>
        <Button variant="outline" loading={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} aria-hidden="true" />Làm mới</Button>
      </div>
      {query.isPending ? <div role="status" aria-label="Đang tải lịch sử thanh toán" className="space-y-3">{[1, 2, 3].map(key => <Skeleton key={key} className="h-32 rounded-xl" />)}</div> : query.isError ? <FeedbackState kind="error" title="Không thể tải lịch sử thanh toán" description="Vui lòng kiểm tra phiên đăng nhập hoặc thử lại để xem giao dịch mới nhất." action={<Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button>} /> : !query.data?.items.length ? <EmptyState
        headingAs="h2"
        icon={<ReceiptText aria-hidden="true" />}
        title={status || page > 1 ? 'Không có giao dịch phù hợp' : 'Chưa có giao dịch thanh toán'}
        description={status || page > 1 ? 'Thử chọn trạng thái khác hoặc quay về trang đầu.' : 'Các đơn hàng của bạn sẽ xuất hiện tại đây sau khi đăng ký gói.'}
        action={status || page > 1 ? <Button variant="outline" onClick={reset}>Xem tất cả giao dịch</Button> : <Link className="service-primary-link" href="/recruiter/pricing">{t('paymentHistoryExplorePlans')}<ArrowRight size={16} aria-hidden="true" /></Link>}
      /> : <>
        <p role="status" className="text-sm text-muted-foreground">{query.data.meta.totalItems} giao dịch{status ? ` · ${paymentHistoryStates[status]}` : ''} · Trang {page}/{query.data.meta.totalPages}</p>
        <ul className="space-y-3" aria-label="Danh sách giao dịch">{query.data.items.map(order => {
          const plan = plans.data?.find(plan => plan.id === order.itemId);
          const name = plan?.name || order.description?.trim() || (order.itemType === 'SUBSCRIPTION' ? 'Đăng ký gói dịch vụ' : order.itemType === 'JOB_BOOST' ? 'Đẩy tin tuyển dụng' : 'Lượt xem hồ sơ');
          return <li key={order.orderId}><article className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0"><h2 className="break-words text-base font-semibold">{name}</h2><p className="mt-2 break-all text-xs text-muted-foreground">Mã đơn: {order.orderCode ?? order.orderId}</p><p className="mt-2 text-sm text-muted-foreground">{order.createdAt ? formatDate(order.createdAt) : 'Chưa có ngày tạo'} · {order.paymentProvider ? paymentProviderLabels[order.paymentProvider] ?? 'Cổng thanh toán khác' : 'Chưa xác định phương thức'}</p></div>
            <div className="flex flex-wrap items-center justify-between gap-3 md:flex-col md:items-start"><strong className="text-base text-primary">{order.currency === 'VND' ? formatVND(order.amount) : `${order.amount} ${order.currency}`}</strong><Badge variant={order.status === 'PAID' ? 'new' : order.status === 'PENDING' || order.status === 'CREATED' ? 'hot' : 'neutral'}>{paymentHistoryStates[order.status]}</Badge></div>
            {order.itemType === 'SUBSCRIPTION' && <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-primary hover:bg-secondary" href={`/recruiter/billing/result?orderId=${order.orderId}`}>Xem giao dịch<ArrowRight size={16} aria-hidden="true" /></Link>}
          </article></li>;
        })}</ul>
        <Pagination page={page} totalPages={query.data.meta.totalPages} disabled={query.isFetching} onPageChange={value => go(value)} />
      </>}
    </section>
  </ServiceFrame>;
}
