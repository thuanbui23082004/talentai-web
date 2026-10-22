'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRecruiterJob, getRecruiterJob, getRecruiterJobOptions, listRecruiterJobs } from '@/features/jobs/services/recruiter-jobs';
import { recruiterJobKeys } from '@/features/jobs/query-keys';

export function useJobOptions() { return useQuery({ queryKey: recruiterJobKeys.options(), queryFn: getRecruiterJobOptions, retry: false }); }
export function useRecruiterJobs() { return useQuery({ queryKey: recruiterJobKeys.lists(), queryFn: listRecruiterJobs, retry: false }); }
export function useRecruiterJob(id: string) { return useQuery({ queryKey: recruiterJobKeys.detail(id), queryFn: () => getRecruiterJob(id), retry: false }); }
export function useCreateJob() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createRecruiterJob, retry: false, onSuccess: job => {
    client.setQueryData(recruiterJobKeys.detail(job.id), job);
    void client.invalidateQueries({ queryKey: recruiterJobKeys.lists() });
  } });
}
