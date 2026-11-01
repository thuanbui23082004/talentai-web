import type { ApplicationFilters } from "./types";
export const applicationKeys = {
    list: (userId: string | undefined, filters: ApplicationFilters) => ["applications", userId, filters] as const,
    interviews: (userId: string | undefined) => ["application-interviews", userId] as const,
};

import type { RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
export const recruiterApplicationKeys = {
  all: ['recruiter-applications'] as const,
  list: (query: RecruiterApplicationQuery) => ['recruiter-applications', 'list', query] as const,
  detail: (id: string) => ['recruiter-applications', 'detail', id] as const,
};
