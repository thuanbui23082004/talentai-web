export const subscriptionPlanKeys = {
    all: ['subscription-plans'] as const,
    current: ['current-subscription'] as const,
    order: (id: string) => ['subscription-order', id] as const,
    status: (id: string, cycle: number) => ['subscription-order', id, 'status', cycle] as const,
};
