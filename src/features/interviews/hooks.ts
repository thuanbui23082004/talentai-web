'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { interviewKeys } from '@/features/interviews/query-keys';
import { recruiterApplicationKeys } from '@/features/applications';
import { updateInterview, resendInvitation, cancelInterview } from '@/features/interviews/services/interview-management';
import type { interviewUpdateSchema } from '@/features/interviews/schemas';
export function useInterviewActions(id: string) {
  const client = useQueryClient();
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: interviewKeys.all }), client.invalidateQueries({ queryKey: recruiterApplicationKeys.all })]); };
  const update = useMutation({ mutationFn: (input: z.infer<typeof interviewUpdateSchema>) => updateInterview(id, input), retry: false, onSuccess: refresh });
  const send = useMutation({ mutationFn: () => resendInvitation(id), retry: false, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: (reason: string) => cancelInterview(id, reason), retry: false, onSuccess: refresh });
  return { update, send, cancel };
}
