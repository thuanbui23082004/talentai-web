'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { paymentApi } from '../services/payment-api';
import { checkoutAttempt, discardRejectedCheckout, readCheckoutAttempt, rememberCheckout } from '../checkout-storage';
import { paymentErrorMessage, safePaymentUrl } from '../payment-presentation';
import type { PaymentMethod, SubscriptionOrder, SubscriptionPlan } from '../types';

export function useCheckout() {
    const router = useRouter();
    const lock = useRef(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string>();
    const [order, setOrder] = useState<SubscriptionOrder>();

    async function submit(plan: SubscriptionPlan, method: PaymentMethod) {
        if (lock.current) return;
        lock.current = true;
        setPending(true);
        setError(undefined);
        try {
            const attempt = checkoutAttempt(plan.id, method);
            if (attempt.orderId) { router.push(`/recruiter/billing/result?orderId=${attempt.orderId}`); return; }
            const callback = new URL('/recruiter/billing/result', window.location.origin);
            callback.searchParams.set('checkout', attempt.key);
            callback.searchParams.set('result', 'return');
            const returnUrl = callback.href;
            callback.searchParams.set('result', 'cancel');
            const result = await paymentApi.create({ itemType: 'SUBSCRIPTION', itemId: plan.id, ...(method === 'BANK' ? {} : { paymentMethod: method }), returnUrl, cancelUrl: callback.href }, attempt.key);
            rememberCheckout({ ...attempt, orderId: result.orderId });
            setOrder(result);
            if (result.amount !== plan.price || result.currency !== plan.currency) return; // Reconfirm a server-side price change.
            proceed(result);
        } catch (error) {
            const previous = readCheckoutAttempt();
            if (error instanceof ApiError && [400, 422].includes(error.status)) discardRejectedCheckout();
            setError(error instanceof Error && error.message === 'CHECKOUT_IN_PROGRESS' ? 'Bạn đang có một lần mua chưa kết thúc. Hãy mở giao dịch đó hoặc chọn lại đúng gói và phương thức để kiểm tra.' : previous ? paymentErrorMessage(error) : 'Trình duyệt chưa cho phép lưu phiên thanh toán. Vui lòng bật lưu trữ cho trang này rồi thử lại.');
        } finally { lock.current = false; setPending(false); }
    }

    function proceed(value = order) {
        if (!value) return;
        const target = safePaymentUrl(value.paymentUrl, window.location.origin);
        if (target && ['PENDING', 'CREATED'].includes(value.status)) {
            setPending(true);
            window.location.assign(target);
        } else router.push(`/recruiter/billing/result?orderId=${value.orderId}`);
    }
    return { submit, proceed, pending, error, order };
}
