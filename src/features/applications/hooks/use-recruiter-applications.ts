'use client';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { recruiterApplicationKeys } from '@/features/applications/query-keys';
import { getApplicantCv, listRecruiterApplications } from '@/features/applications/services/recruiter-applications';
import type { RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
export function useRecruiterApplications(query: RecruiterApplicationQuery, enabled = true) {
  return useQuery({ queryKey: recruiterApplicationKeys.list(query), queryFn: () => listRecruiterApplications(query), enabled, retry: false, placeholderData: keepPreviousData });
}
export function useApplicantCv() { return useMutation({ mutationFn: getApplicantCv, retry: false, gcTime: 0 }); }
