'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../services/subscription-api';
import { subscriptionPlanKeys } from '../query-keys';

export function useCurrentSubscription() {
    return useQuery({
        queryKey: subscriptionPlanKeys.current,
        queryFn: ({ signal }) => subscriptionApi.current(signal),
        retry: false,
        staleTime: 0,
        refetchOnWindowFocus: 'always',
    });
}
