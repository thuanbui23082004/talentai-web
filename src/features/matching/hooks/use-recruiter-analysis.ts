'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startRecruiterScreening, startRecruiterMatching, getRecruiterMatching, getRecommendedCandidates, listRankedApplications } from '@/features/matching/services/recruiter-matching';
import { useAnalysisProgress, analysisKeys } from '@/features/cv-analysis/hooks/use-analysis-progress';
import { isAnalysisFinished } from '@/features/cv-analysis/progress';
import type { AnalysisTask } from '@/lib/api/analysis-schemas';
import type { RecruiterApplicationQuery } from '@/lib/api/application-schemas';
export function useRecruiterAnalysis(type: 'screening' | 'matching', id: string) {
  const client = useQueryClient(); const activeKey = ['recruiter-ai-active', type, id];
  const active = useQuery<AnalysisTask | null>({ queryKey: activeKey, queryFn: async () => null, enabled: false, initialData: null });
  const progress = useAnalysisProgress(active.data?.taskId ?? null);
  const start = useMutation({ mutationFn: () => type === 'screening' ? startRecruiterScreening(id) : startRecruiterMatching(id), retry: false, onSuccess: task => {
    client.setQueryData(analysisKeys.task(task.taskId), task); client.setQueryData(activeKey, task);
  } });
  const task = progress.data ?? active.data;
  return { start, progress, task, busy: start.isPending || !!task && !isAnalysisFinished(task) };
}
export function useMatchingResult(applicationId: string) { return useQuery({ queryKey: analysisKeys.matching(applicationId), queryFn: () => getRecruiterMatching(applicationId), retry: false }); }
export function useRankedApplications(jobId: string, query: RecruiterApplicationQuery, enabled = true) { return useQuery({ queryKey: [...analysisKeys.all, 'ranking', jobId, query], queryFn: () => listRankedApplications(jobId, query), retry: false, enabled }); }
export function useRecommendedCandidates(jobId: string) { return useQuery({ queryKey: [...analysisKeys.all, 'recommended', jobId], queryFn: () => getRecommendedCandidates(jobId), retry: false }); }
