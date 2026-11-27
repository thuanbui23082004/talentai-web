'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { FeedbackState } from '@/components/shared/feedback-state';
import { useSubscriptionPlans } from '../hooks/use-subscription-plans';
import { useCurrentSubscription } from '../hooks/use-current-subscription';
import { formatDate } from '@/lib/utils';
import { planFeatureLabel, planFeatureValue, planPrice } from '../plan-presentation';
import { ServiceFrame } from './service-frame';
import { CheckoutDialog } from './checkout-dialog';
import { CheckoutResume } from './checkout-resume';
import type { SubscriptionPlan } from '../types';

export function PricingPage() {
    const t = useTranslations('RecruiterServices');
    const query = useSubscriptionPlans();
    const current = useCurrentSubscription();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan>();
    const benefitsRef = useRef<HTMLElement>(null);
    const plans = query.data ?? [];
    const selectedPlan = plans.find(plan => plan.id === selectedId);
    const featureKeys = [...new Set(plans.flatMap(plan => Object.keys(plan.features)))];

    useEffect(() => {
        if (!selectedId) return;
        benefitsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }, [selectedId]);

    return <ServiceFrame active="pricing">
        <header className="service-page-heading">
            <span className="service-eyebrow">{t('heroTag')}</span>
            <h1>{t('pricingTitle')}</h1>
            <p>So sánh giá, thời hạn và quyền lợi theo nhu cầu tuyển dụng của doanh nghiệp.</p>
        </header>

        <section className="mb-6 rounded-xl border border-border bg-card p-5" aria-label="Gói dịch vụ hiện tại" aria-live="polite">
            {current.isPending ? <Skeleton className="h-12 w-full" aria-label="Đang tải gói hiện tại" /> : current.isError ? <div className="flex flex-wrap items-center justify-between gap-3"><p role="alert">Chưa thể tải gói hiện tại. Vui lòng thử lại.</p><Button variant="outline" onClick={() => void current.refetch()}>Tải lại gói hiện tại</Button></div> : <>
                <p className="font-semibold">{current.data?.status === 'ACTIVE' && current.data.plan ? `Đang sử dụng: ${current.data.plan.name}` : 'Bạn chưa có gói đang hoạt động'}</p>
                {current.data?.status === 'ACTIVE' && current.data.expiresAt && <p className="mt-1 text-sm text-muted-foreground">Hiệu lực đến {formatDate(current.data.expiresAt)}</p>}
            </>}
        </section>

        <CheckoutResume plans={plans} onResume={setCheckoutPlan} />
        {query.isPending ? <div className="service-plans-grid" role="status" aria-label="Đang tải các gói dịch vụ">
            {[1, 2, 3].map(key => <Skeleton key={key} className="h-96 rounded-2xl" />)}
        </div> : query.isError ? <FeedbackState kind="error" title="Không thể tải các gói dịch vụ" description="Vui lòng thử lại để xem bảng giá mới nhất." action={<Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button>} /> : plans.length === 0 ? <EmptyState title="Chưa có gói dịch vụ" description="Các gói đang hoạt động sẽ được hiển thị tại đây." /> : <>
            <div className="service-plans-grid">
                {plans.map(plan => <article className={`service-plan-card${selectedId === plan.id ? ' is-featured' : ''}`} key={plan.id}>
                    <span className="mb-3 text-xs font-semibold tracking-wider text-primary">{plan.code}</span>
                    <h2>{plan.name}</h2>
                    {current.data?.status === 'ACTIVE' && current.data.plan?.code === plan.code && <span className="mb-3 self-start rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-primary">Đang sử dụng</span>}
                    <p className="service-plan-description">{plan.description}</p>
                    <div className="service-plan-price"><strong>{planPrice(plan)}</strong><span>Thời hạn {plan.durationDays} ngày</span></div>
                    <ul>
                        {Object.entries(plan.features).map(([key, value]) => <li key={key}>
                            {value === false || value === 0 ? <Minus size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                            <span>{planFeatureLabel(key)}: <strong className="font-semibold">{planFeatureValue(key, value)}</strong></span>
                        </li>)}
                    </ul>
                    <Button variant={selectedId === plan.id ? 'default' : 'outline'} onClick={() => setSelectedId(plan.id)} aria-expanded={selectedId === plan.id} aria-controls={selectedId === plan.id ? 'plan-benefits' : undefined}>{t('viewBenefits')}</Button>
                    {plan.price > 0 && <Button className="mt-3" aria-label={`Đăng ký ${plan.name}`} disabled={current.isPending || current.isError || current.data?.status === 'ACTIVE' && current.data.plan?.code === plan.code} onClick={() => setCheckoutPlan(plan)}>{current.data?.status === 'ACTIVE' && current.data.plan?.code === plan.code ? 'Đang sử dụng' : 'Đăng ký gói'}</Button>}
                    {plan.price === 0 && <Link className="service-start-free" href="/recruiter/jobs/new">{t('start')}</Link>}
                </article>)}
            </div>

            {selectedPlan && <section ref={benefitsRef} className="service-benefit-panel" id="plan-benefits" aria-label={`Quyền lợi ${selectedPlan.name}`}>
                <header><h2>Quyền lợi {selectedPlan.name}</h2><Button size="sm" variant="ghost" aria-label="Đóng chi tiết gói" onClick={() => setSelectedId(null)}><X size={15} /></Button></header>
                <div className="service-benefit-grid">
                    <ul>{Object.entries(selectedPlan.features).map(([key, value]) => <li key={key}>{planFeatureLabel(key)}: {planFeatureValue(key, value)}</li>)}</ul>
                    <dl><div><dt>Thời hạn</dt><dd>{selectedPlan.durationDays} ngày</dd></div><div className="service-total"><dt>Giá gói</dt><dd>{planPrice(selectedPlan)}</dd></div></dl>
                </div>
                <Link className="service-primary-link" href="/recruiter/services">{t('useTools')}</Link>
            </section>}

            <section className="service-comparison">
                <h2>{t('compare')}</h2>
                <div className="service-table-scroll"><table>
                    <caption className="sr-only">So sánh quyền lợi và thời hạn các gói dịch vụ</caption>
                    <thead><tr><th scope="col">{t('feature')}</th>{plans.map(plan => <th scope="col" key={plan.id}>{plan.name}</th>)}</tr></thead>
                    <tbody>
                        <tr><th scope="row">Giá gói</th>{plans.map(plan => <td key={plan.id}>{planPrice(plan)}</td>)}</tr>
                        <tr><th scope="row">Thời hạn</th>{plans.map(plan => <td key={plan.id}>{plan.durationDays} ngày</td>)}</tr>
                        {featureKeys.map(key => <tr key={key}><th scope="row">{planFeatureLabel(key)}</th>{plans.map(plan => <td key={plan.id}>{planFeatureValue(key, plan.features[key])}</td>)}</tr>)}
                    </tbody>
                </table></div>
            </section>
        </>}
        {checkoutPlan && <CheckoutDialog plan={checkoutPlan} onClose={() => setCheckoutPlan(undefined)} />}
    </ServiceFrame>;
}
