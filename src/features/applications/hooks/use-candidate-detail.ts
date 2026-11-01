'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import type { evaluationInputSchema, interviewInputSchema, statusUpdateSchema } from '@/lib/api/candidate-detail-schemas';
import { recruiterApplicationKeys } from '@/features/applications/query-keys';
import { createCandidateInterview, getCandidateDetail, saveCandidateEvaluation, updateCandidateStatus } from '@/features/applications/services/candidate-detail';
export function useCandidateDetail(id: string) { return useQuery({ queryKey: recruiterApplicationKeys.detail(id), queryFn: () => getCandidateDetail(id), retry: false }); }
export function useCandidateActions(id: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: recruiterApplicationKeys.all });
  const status = useMutation({ mutationFn: (input: z.input<typeof statusUpdateSchema>) => updateCandidateStatus(id, input), retry: false, onSuccess: async data => { client.setQueryData(recruiterApplicationKeys.detail(id), data); await refresh(); } });
  const evaluation = useMutation({ mutationFn: (input: z.input<typeof evaluationInputSchema>) => saveCandidateEvaluation(id, input), retry: false, onSuccess: refresh });
  const interview = useMutation({ mutationFn: ({ input, key }: { input: z.input<typeof interviewInputSchema>; key: string }) => createCandidateInterview(input, key), retry: false, onSuccess: refresh });
  return { status, evaluation, interview };
}
