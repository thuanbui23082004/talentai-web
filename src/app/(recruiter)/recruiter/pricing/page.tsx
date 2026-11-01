import { mockRecruiterPlans, mockRecruiterOffers } from '@/mocks/fixtures/recruiter-services';
import { Suspense } from 'react';
import { PricingPage } from '@/features/recruiter-services';
import { offerQuerySchema } from '@/features/recruiter-services';
async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = offerQuerySchema.safeParse(await searchParams);
  return <PricingPage plans={mockRecruiterPlans} offers={mockRecruiterOffers} key={parsed.success ? parsed.data.offer ?? 'none' : 'invalid'} initialOffer={parsed.success ? parsed.data.offer : undefined} invalidOffer={!parsed.success} />;
}
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={null}><Content searchParams={searchParams} /></Suspense>;
}
