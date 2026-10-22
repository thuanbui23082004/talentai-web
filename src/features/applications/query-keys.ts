import type { RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
export const recruiterApplicationKeys = {
  all: ['recruiter-applications'] as const,
  list: (query: RecruiterApplicationQuery) => ['recruiter-applications', 'list', query] as const,
  detail: (id: string) => ['recruiter-applications', 'detail', id] as const,
};
