'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../services/payment-api';
import { subscriptionApi } from '../services/subscription-api';
import { subscriptionPlanKeys } from '../query-keys';
import { ACTIVATION_MAX_CHECKS, isActivePlan, isPendingPayment, PAYMENT_MAX_CHECKS, PAYMENT_POLL_INTERVAL } from '../payment-presentation';

export function usePaymentResult(orderId?: string) {
    const [cycle, setCycle] = useState(0);
    const client = useQueryClient();
    const attempts = useRef({ round: '', count: 0 });
    const detail = useQuery({ queryKey: subscriptionPlanKeys.order(orderId ?? ''), queryFn: ({ signal }) => paymentApi.get(orderId!, signal), enabled: Boolean(orderId), retry: false, refetchOnWindowFocus: false });
    const status = useQuery({
        queryKey: subscriptionPlanKeys.status(orderId ?? '', cycle),
        queryFn: async ({ signal, queryKey }) => {
            const round = `${orderId}:${cycle}`;
            if (attempts.current.round !== round) attempts.current = { round, count: 0 };
            // Count before the request: an aborted request still consumes a check.
            // This also bounds React Strict Mode's initial abort/restart in dev.
            const previous = client.getQueryData<{ order: Awaited<ReturnType<typeof paymentApi.status>>; attempt: number }>(queryKey);
            if (attempts.current.count >= PAYMENT_MAX_CHECKS) {
                if (previous) return { ...previous, attempt: PAYMENT_MAX_CHECKS };
                throw new Error('Payment checks exhausted');
            }
            const attempt = ++attempts.current.count;
            return { order: await paymentApi.status(orderId!, signal), attempt };
        }, enabled: Boolean(orderId), retry: false,
        refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false,
        refetchInterval: query => query.state.error || !isPendingPayment(query.state.data?.order.status) || (query.state.data?.attempt ?? 0) >= PAYMENT_MAX_CHECKS ? false : PAYMENT_POLL_INTERVAL,
    });
    return { detail, status, restart: () => { setCycle(value => value + 1); void detail.refetch(); } };
}

export function useSubscriptionActivation(code: string | undefined, paid: boolean) {
    const [cycle, setCycle] = useState(0);
    const client = useQueryClient();
    const attempts = useRef({ round: '', count: 0 });
    const query = useQuery({
        queryKey: [...subscriptionPlanKeys.current, 'activation', code, cycle],
        queryFn: async ({ signal, queryKey }) => {
            const round = `${code}:${cycle}`;
            if (attempts.current.round !== round) attempts.current = { round, count: 0 };
            const previous = client.getQueryData<{ subscription: Awaited<ReturnType<typeof subscriptionApi.current>>; attempt: number }>(queryKey);
            if (attempts.current.count >= ACTIVATION_MAX_CHECKS) {
                if (previous) return { ...previous, attempt: ACTIVATION_MAX_CHECKS };
                throw new Error('Activation checks exhausted');
            }
            const attempt = ++attempts.current.count;
            return { subscription: await subscriptionApi.current(signal), attempt };
        }, enabled: paid && Boolean(code), retry: false,
        refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false,
        refetchInterval: query => query.state.error || isActivePlan(query.state.data?.subscription, code) || (query.state.data?.attempt ?? 0) >= ACTIVATION_MAX_CHECKS ? false : PAYMENT_POLL_INTERVAL,
    });
    return { query, restart: () => setCycle(value => value + 1) };
}
