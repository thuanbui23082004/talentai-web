'use client';

import { useQuery } from '@tanstack/react-query';
import { listSubscriptionPlans } from '../services/subscription-plans';
import { subscriptionPlanKeys } from '../query-keys';

export function useSubscriptionPlans() {
    return useQuery({
        queryKey: subscriptionPlanKeys.all,
        queryFn: ({ signal }) => listSubscriptionPlans(signal),
        retry: false,
        staleTime: 60000,
    });
}
