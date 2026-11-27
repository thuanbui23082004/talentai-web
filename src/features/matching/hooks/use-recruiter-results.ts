'use client';

import { useQuery } from '@tanstack/react-query';
import { getApplicationMatch, getApplicationMatches, getMatchRankings, listRankingApplicants } from '../services/recruiter-results';

export const recruiterMatchKeys = {
  all: ['recruiter-match-results'] as const,
  application: (applicationId: string) => [...recruiterMatchKeys.all, 'application', applicationId] as const,
  batch: (jobId: string, applicationIds: string[]) => [...recruiterMatchKeys.all, 'batch', jobId, applicationIds] as const,
  rankings: (jobId: string, page: number) => [...recruiterMatchKeys.all, 'rankings', jobId, page] as const,
  applicants: (jobId: string) => [...recruiterMatchKeys.all, 'applicants', jobId] as const,
};

export function useApplicationMatch(applicationId: string) {
  return useQuery({ queryKey: recruiterMatchKeys.application(applicationId), queryFn: ({ signal }) => getApplicationMatch(applicationId, signal), retry: false });
}

export function useApplicationMatches(jobId: string, applicationIds: string[]) {
  return useQuery({ queryKey: recruiterMatchKeys.batch(jobId, applicationIds), queryFn: ({ signal }) => getApplicationMatches(jobId, applicationIds, signal), enabled: !!jobId && applicationIds.length > 0, retry: false });
}

export function useMatchRankings(jobId: string, page: number) {
  return useQuery({ queryKey: recruiterMatchKeys.rankings(jobId, page), queryFn: ({ signal }) => getMatchRankings(jobId, page, 20, signal), enabled: !!jobId, retry: false });
}

export function useRankedJobApplicants(jobId: string) {
  return useQuery({ queryKey: recruiterMatchKeys.applicants(jobId), queryFn: ({ signal }) => listRankingApplicants(jobId, signal), enabled: !!jobId, retry: false });
}
