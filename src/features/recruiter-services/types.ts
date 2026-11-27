import type { components } from '@/lib/api/generated/schema';

export type SubscriptionPlan = components['schemas']['SubscriptionPlan'];
export type PaymentOrderPage = components['schemas']['PaymentOrderPage'];
export type PaymentHistoryFilters = { page: number; pageSize: number; status?: components['schemas']['SubscriptionOrderState'] };
export type CurrentSubscription = components['schemas']['CurrentSubscription'];
export type SubscriptionOrder = components['schemas']['SubscriptionOrder'];
export type SubscriptionOrderState = components['schemas']['SubscriptionOrderState'];
export type CreateSubscriptionOrder = components['schemas']['CreateSubscriptionOrder'];
export type PaymentMethod = NonNullable<CreateSubscriptionOrder['paymentMethod']> | 'BANK';
