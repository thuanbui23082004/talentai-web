import plans from '../../../contracts/examples/subscription-plans.json';
import type { components } from '@/lib/api/generated/schema';

export const mockSubscriptionPlans: components['schemas']['SubscriptionPlan'][] = plans;
