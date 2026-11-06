'use client';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { recruiterApplicationKeys } from '@/features/applications/query-keys';
import { getApplicantCv, listRecruiterApplications, listJobApplicants, getJobApplicant, getJobApplicantResume, getJobApplicantCv, type JobApplicantFilters } from '@/features/applications/services/recruiter-applications';
import { useSession } from '@/features/auth';
import type { RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
export function useRecruiterApplications(query: RecruiterApplicationQuery, enabled = true) {
  return useQuery({ queryKey: recruiterApplicationKeys.list(query), queryFn: () => listRecruiterApplications(query), enabled, retry: false, placeholderData: keepPreviousData });
}
export function useApplicantCv() { return useMutation({ mutationFn: getApplicantCv, retry: false, gcTime: 0 }); }
export function useJobApplicants(jobId: string, query: JobApplicantFilters, enabled: boolean) {
  const { user } = useSession();
  return useQuery({ queryKey: recruiterApplicationKeys.jobApplicants(user?.id, jobId, query), queryFn: ({ signal }) => listJobApplicants(jobId, query, signal), enabled: enabled && !!jobId && user?.role === 'recruiter', retry: false });
}
export function useJobApplicant(id: string) {
  const { user } = useSession();
  return useQuery({ queryKey: recruiterApplicationKeys.jobApplicant(user?.id, id), queryFn: ({ signal }) => getJobApplicant(id, signal), enabled: user?.role === 'recruiter', retry: false });
}
export function useJobApplicantResume(id: string, enabled = true) {
  const { user } = useSession();
  return useQuery({ queryKey: recruiterApplicationKeys.jobApplicantResume(user?.id, id), queryFn: ({ signal }) => getJobApplicantResume(id, signal), enabled: enabled && user?.role === 'recruiter', retry: false, staleTime: 0, gcTime: 0 });
}
export function useJobApplicantCv(id: string, enabled: boolean) {
  const { user } = useSession();
  return useQuery({ queryKey: [...recruiterApplicationKeys.jobApplicantResume(user?.id, id), 'pdf'], queryFn: ({ signal }) => getJobApplicantCv(id, signal), enabled: enabled && user?.role === 'recruiter', retry: false, gcTime: 0 });
}
