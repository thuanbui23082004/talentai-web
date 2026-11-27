'use client';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../services/payment-api';
import { subscriptionPlanKeys } from '../query-keys';
import type { PaymentHistoryFilters } from '../types';

export function usePaymentHistory(filters: PaymentHistoryFilters) {
    return useQuery({ queryKey: subscriptionPlanKeys.history(filters), queryFn: ({ signal }) => paymentApi.history(filters, signal), retry: false, staleTime: 0, refetchOnWindowFocus: true });
}
