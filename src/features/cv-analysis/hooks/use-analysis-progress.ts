'use client';
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnalysisTask } from '@/features/matching';
import { isAnalysisFinished } from '@/features/cv-analysis/progress';
import { recruiterApplicationKeys } from '@/features/applications';
export const analysisKeys = {
  all: ['recruiter-ai'] as const,
  task: (id: string | null) => ['recruiter-ai-task', id] as const,
  matching: (id: string) => ['recruiter-ai', 'matching', id] as const,
};
export function useAnalysisProgress(taskId: string | null) {
  const client = useQueryClient(); const refreshed = useRef<string | null>(null);
  // OpenAPI exposes task polling only; no SSE endpoint is invented here.
  const query = useQuery({ queryKey: analysisKeys.task(taskId), queryFn: ({ signal }) => getAnalysisTask(taskId!, signal), enabled: !!taskId, retry: false,
    refetchInterval: query => query.state.error || isAnalysisFinished(query.state.data) ? false : 1000,
  });
  useEffect(() => {
    if (query.data?.status !== 'completed' || refreshed.current === query.data.taskId) return;
    refreshed.current = query.data.taskId;
    void Promise.all([client.invalidateQueries({ queryKey: recruiterApplicationKeys.all }), client.invalidateQueries({ queryKey: analysisKeys.all })]);
  }, [query.data, client]);
  return query;
}
