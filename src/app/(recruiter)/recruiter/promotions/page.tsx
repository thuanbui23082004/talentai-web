import { mockRecruiterOffers } from '@/mocks/fixtures/recruiter-services';
import { PromotionsPage } from '@/features/recruiter-services';
export default function Page() { return <PromotionsPage offers={mockRecruiterOffers} />; }
