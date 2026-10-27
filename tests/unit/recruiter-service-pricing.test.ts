import { expect, it } from 'vitest';
import { mockRecruiterPlans, mockRecruiterOffers } from '@/mocks/fixtures/recruiter-services';
import { isOfferActive, quotePlan } from '@/features/recruiter-services/pricing';
import { planSchema, offerSchema, offerQuerySchema } from '@/features/recruiter-services/schemas';
it('quotes free, monthly and yearly plans with integer VND totals', () => {
  const [free, growth] = mockRecruiterPlans;
  expect(quotePlan(free, 'year').total).toBe(0);
  expect(quotePlan(growth, 'month').total).toBe(990000);
  expect(quotePlan(growth, 'year')).toMatchObject({ listPrice: 11880000, cycleSaving: 1782000, total: 10098000 });
});
it('applies only active offers for an eligible plan and billing cycle', () => {
  const [free, growth, pro] = mockRecruiterPlans; const [welcome, ai, annual] = mockRecruiterOffers;
  const today = '2026-10-23';
  expect(quotePlan(growth, 'month', welcome, today)).toMatchObject({ eligible: true, offerSaving: 198000, total: 792000 });
  expect(quotePlan(free, 'month', welcome, today).eligible).toBe(false);
  expect(quotePlan(growth, 'month', ai, today).eligible).toBe(false);
  expect(quotePlan(pro, 'year', welcome, today).eligible).toBe(false);
  expect(quotePlan(pro, 'month', ai, '2028-01-01').eligible).toBe(false);
  expect(quotePlan(growth, 'year', annual, today)).toMatchObject({ eligible: true, cycleSaving: 1782000, offerSaving: 1009800, total: 9088200 });
});
it('uses inclusive offer dates and rejects malformed proposal or query data', () => {
  const offer = mockRecruiterOffers[0];
  expect(isOfferActive(offer, offer.startsAt)).toBe(true);
  expect(isOfferActive(offer, offer.endsAt)).toBe(true);
  expect(isOfferActive(offer, '2025-12-31')).toBe(false);
  expect(planSchema.safeParse({ ...mockRecruiterPlans[0], monthlyPrice: -1 }).success).toBe(false);
  expect(offerSchema.safeParse({ ...offer, percent: 101 }).success).toBe(false);
  expect(offerSchema.safeParse({ ...offer, endsAt: '2025-01-01' }).success).toBe(false);
  expect(offerQuerySchema.safeParse({ offer: ['WELCOME20'] }).success).toBe(false);
});
