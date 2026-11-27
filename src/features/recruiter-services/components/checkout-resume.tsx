'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { readCheckoutAttempt } from '../checkout-storage';
import type { SubscriptionPlan } from '../types';

const subscribe = () => () => {};
export function CheckoutResume({ plans, onResume }: { plans: SubscriptionPlan[]; onResume: (plan: SubscriptionPlan) => void }) {
    const ready = useSyncExternalStore(subscribe, () => true, () => false);
    const attempt = ready ? readCheckoutAttempt() : undefined;
    if (!attempt || attempt.finished) return null;
    const plan = plans.find(plan => plan.id === attempt.planId);
    return <aside className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm" aria-label="Lần mua đang xử lý">
        <p>Bạn có một lần mua {plan?.name ?? 'gói dịch vụ'} chưa kết thúc.</p>
        {attempt.orderId ? <Link className="inline-flex min-h-11 items-center font-semibold text-primary underline" href={`/recruiter/billing/result?orderId=${attempt.orderId}`}>Kiểm tra giao dịch</Link> : plan && <Button variant="outline" onClick={() => onResume(plan)}>Tiếp tục lần mua</Button>}
    </aside>;
}
