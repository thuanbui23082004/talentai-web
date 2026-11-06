import type { ApplicationFilters } from "./types";
export const applicationKeys = {
    all: ["applications"] as const,
    list: (userId: string | undefined, filters: ApplicationFilters) => ["applications", userId, filters] as const,
    interviews: (userId: string | undefined) => ["application-interviews", userId] as const,
};

import type { RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
export const recruiterApplicationKeys = {
  jobApplicants: (userId: string | undefined, jobId: string, query: object) => ['recruiter-job-applicants', userId, jobId, query] as const,
  jobApplicant: (userId: string | undefined, id: string) => ['recruiter-job-application', userId, id] as const,
  jobApplicantResume: (userId: string | undefined, id: string) => ['recruiter-job-application-resume', userId, id] as const,
  all: ['recruiter-applications'] as const,
  list: (query: RecruiterApplicationQuery) => ['recruiter-applications', 'list', query] as const,
  detail: (id: string) => ['recruiter-applications', 'detail', id] as const,
};
