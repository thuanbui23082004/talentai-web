'use client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruiterApplicationKeys } from '@/features/applications/query-keys';
import { listRecruiterApplications } from '@/features/applications/services/recruiter-applications';
import { updateCandidateStatus } from '@/features/applications/services/candidate-detail';
import { nextPipelinePage, pipelinePageSize, pipelineMoveSchema, type ApplicationStatus } from '@/features/applications/pipeline';
import type { RecruiterApplication } from '@/features/applications/types';
import type { z } from 'zod';

export function usePipelineColumn(status: ApplicationStatus) {
  return useInfiniteQuery({
    queryKey: [...recruiterApplicationKeys.all, 'pipeline', status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listRecruiterApplications({ status: [status], sort: 'applied_desc', page: pageParam, pageSize: pipelinePageSize }),
    getNextPageParam: last => nextPipelinePage(last.meta),
    retry: false,
  });
}
export function usePipelineMove() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ application, values }: { application: RecruiterApplication; values: z.infer<typeof pipelineMoveSchema> }) => {
      const parsed = pipelineMoveSchema.parse({ ...values, from: application.status });
      return updateCandidateStatus(application.id, { status: parsed.to, round: application.currentRound, notifyCandidate: true });
    },
    retry: false,
    onSuccess: async application => {
      client.setQueryData(recruiterApplicationKeys.detail(application.id), application);
      await client.invalidateQueries({ queryKey: recruiterApplicationKeys.all });
    },
  });
}
