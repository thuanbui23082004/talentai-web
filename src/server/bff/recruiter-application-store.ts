import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import type { components } from '@/lib/api/generated/schema';
type Application = components['schemas']['RecruiterApplicationDetail'];
const appGlobal = globalThis as typeof globalThis & { talentaiRecruiterApplications?: Application[] };
export function getRecruiterApplicationStore() {
  const applications = appGlobal.talentaiRecruiterApplications ??= structuredClone(mockCandidateDetails);
  for (const application of applications) {
    if (!application.profile) {
      const seed = mockCandidateDetails.find(item => item.id === application.id);
      if (seed) Object.assign(application, structuredClone(seed), { status: application.status, evaluation: application.evaluation });
    }
  }
  return applications;
}
