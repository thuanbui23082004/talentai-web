import { z } from 'zod';
import { planSchema, offerSchema } from '@/features/recruiter-services';
// UI proposal approved by the user. These are not API responses or active subscriptions.
export const mockRecruiterPlans = z.array(planSchema).parse([
  { id: 'starter', monthlyPrice: 0, annualDiscount: 0, jobs: 3, analyses: 25, featured: false },
  { id: 'growth', monthlyPrice: 990000, annualDiscount: 15, jobs: 15, analyses: 150, featured: true },
  { id: 'pro', monthlyPrice: 2490000, annualDiscount: 15, jobs: 50, analyses: 500, featured: false },
]);
export const mockRecruiterOffers = z.array(offerSchema).parse([
  { id: 'welcome', code: 'WELCOME20', percent: 20, planIds: ['growth', 'pro'], cycle: 'month', startsAt: '2026-01-01', endsAt: '2027-12-31', category: 'new' },
  { id: 'ai', code: 'TALENTAI15', percent: 15, planIds: ['pro'], cycle: 'month', startsAt: '2026-01-01', endsAt: '2027-12-31', category: 'ai' },
  { id: 'annual', code: 'YEAR10', percent: 10, planIds: ['growth', 'pro'], cycle: 'year', startsAt: '2026-01-01', endsAt: '2027-12-31', category: 'annual' },
]);
