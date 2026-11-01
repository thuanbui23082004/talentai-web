import type { BillingCycle, ServiceOffer, ServicePlan } from '@/features/recruiter-services/schemas';
export function isOfferActive(offer: ServiceOffer, today: string) { return offer.startsAt <= today && today <= offer.endsAt; }
export function quotePlan(plan: ServicePlan, cycle: BillingCycle, offer?: ServiceOffer, today = '') {
  const listPrice = plan.monthlyPrice * (cycle === 'year' ? 12 : 1);
  const cycleSaving = cycle === 'year' ? Math.round(listPrice * plan.annualDiscount / 100) : 0;
  const eligible = !!offer && plan.monthlyPrice > 0 && offer.planIds.includes(plan.id) && (!offer.cycle || offer.cycle === cycle) && isOfferActive(offer, today);
  const offerSaving = eligible ? Math.round((listPrice - cycleSaving) * offer.percent / 100) : 0;
  return { listPrice, cycleSaving, offerSaving, total: listPrice - cycleSaving - offerSaving, eligible };
}
