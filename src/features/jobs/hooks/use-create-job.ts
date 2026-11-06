'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRecruiterJob, getRecruiterJob, getRecruiterJobOptions, getJobPostingOptions, listRecruiterJobs, updateRecruiterJob, deleteRecruiterJob, publishRecruiterJob, changeRecruiterJobStatus } from '@/features/jobs/services/recruiter-jobs';
import type { JobInput, JobPostingInput, RecruiterJob } from '@/features/jobs/types';
import { recruiterJobKeys } from '@/features/jobs/query-keys';
import type { RecruiterJobFilters } from '@/lib/jobs/recruiter-filters';

export function useJobOptions() { return useQuery({ queryKey: recruiterJobKeys.options(), queryFn: getRecruiterJobOptions, retry: false }); }
export function useJobPostingOptions() { return useQuery({ queryKey: recruiterJobKeys.postingOptions(), queryFn: getJobPostingOptions, retry: false }); }
export function useRecruiterJobs(filters: RecruiterJobFilters = {}) {
  return useQuery({ queryKey: [...recruiterJobKeys.lists(), filters], queryFn: ({ signal }) => listRecruiterJobs(filters, signal), retry: false });
}
export function useRecruiterJob(id: string) { return useQuery({ queryKey: recruiterJobKeys.detail(id), queryFn: () => getRecruiterJob(id), retry: false }); }
export function useSaveJob(id?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: JobInput | JobPostingInput) => id ? updateRecruiterJob(id, input) : createRecruiterJob(input), retry: false, onSuccess: job => {
    client.setQueryData(recruiterJobKeys.detail(job.id), job);
    void client.invalidateQueries({ queryKey: recruiterJobKeys.lists() });
  } });
}
export function useCreateJob() { return useSaveJob(); }
export function useJobStatus(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (action: import('@/features/jobs/job-status').JobStatusAction) => changeRecruiterJobStatus(id, action, client.getQueryData<RecruiterJob>(recruiterJobKeys.detail(id))?.posting?.version), retry: false, onSuccess: async job => {
    client.setQueryData(recruiterJobKeys.detail(id), job);
    await Promise.all([client.invalidateQueries({ queryKey: recruiterJobKeys.lists() }), client.invalidateQueries({ queryKey: ['recruiter-stats'] })]);
  } });
}
export function useJobManagement(id: string) {
  const client = useQueryClient();
  return {
    publish: useMutation({ mutationFn: () => publishRecruiterJob(id, client.getQueryData<RecruiterJob>(recruiterJobKeys.detail(id))?.posting?.version), retry: false, onSuccess: async job => {
      client.setQueryData(recruiterJobKeys.detail(id), job);
      await client.invalidateQueries({ queryKey: recruiterJobKeys.lists() });
    } }),
    remove: useMutation({ mutationFn: () => deleteRecruiterJob(id, client.getQueryData<RecruiterJob>(recruiterJobKeys.detail(id))?.posting?.version), retry: false, onSuccess: async () => {
      client.removeQueries({ queryKey: recruiterJobKeys.detail(id), exact: true });
      await client.invalidateQueries({ queryKey: recruiterJobKeys.lists() });
    } }),
  };
}
