import type { components } from '@/lib/api/generated/schema';
import example from '../../../contracts/examples/payment-history.json';

// A typed example for verification; the mock endpoint lists actual in-memory orders.
export const paymentHistoryExample: components['schemas']['PaymentOrderPage'] = {
    items: example.items.map(item => ({ ...item, itemType: 'SUBSCRIPTION', status: 'PAID' })),
    meta: example.meta,
};
