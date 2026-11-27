import type { components } from '@/lib/api/generated/schema';
import subscription from '../../../contracts/examples/current-subscription.json';
import order from '../../../contracts/examples/subscription-order.json';

export const mockCurrentSubscription: components['schemas']['CurrentSubscription'] = subscription;
export const mockSubscriptionOrder: components['schemas']['SubscriptionOrder'] = { ...order, itemType: 'SUBSCRIPTION', status: 'PENDING' };
