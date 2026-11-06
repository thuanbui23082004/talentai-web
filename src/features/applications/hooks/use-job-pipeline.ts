'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth';
import { listJobPipeline, updateJobApplicantStatus } from '../services/recruiter-applications';
import { recruiterApplicationKeys } from '../query-keys';
export function useJobPipeline(jobId: string) {
  const {
    user
  } = useSession();
  return useQuery({
    queryKey: ['recruiter-job-pipeline', user?.id, jobId],
    queryFn: ({
      signal
    }) => listJobPipeline(jobId, signal),
    enabled: !!jobId && user?.role === 'recruiter',
    retry: false
  });
}
export function useJobPipelineMove(jobId: string) {
  const client = useQueryClient();
  const {
    user
  } = useSession();
  return useMutation({
    mutationFn: updateJobApplicantStatus,
    retry: false,
    onSuccess: item => {
      client.setQueryData(recruiterApplicationKeys.jobApplicant(user?.id, item.id), item);
    },
    // Refresh even after a timeout/conflict: the server may have already saved the change.
    onSettled: async () => {
      await Promise.all([client.invalidateQueries({
        queryKey: ['recruiter-job-pipeline', user?.id, jobId]
      }), client.invalidateQueries({
        queryKey: ['recruiter-job-applicants', user?.id, jobId]
      })]);
    }
  });
}
