import type { AnalysisTask } from '@/lib/api/analysis-schemas';
export function analysisPhase(task: Pick<AnalysisTask, 'status' | 'progress'>) {
  if (task.status === 'pending') return 'queued';
  if (task.status === 'processing') return task.progress !== undefined && task.progress < 40 ? 'parsing' : 'analyzing';
  return task.status;
}
export const isAnalysisFinished = (task?: Pick<AnalysisTask, 'status'> | null) => task?.status === 'completed' || task?.status === 'failed';
