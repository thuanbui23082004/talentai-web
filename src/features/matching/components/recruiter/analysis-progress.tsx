'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { analysisPhase } from '@/features/cv-analysis/progress';
import { analysisErrorKeys, ScreeningError } from '@/features/matching/errors';
import type { useRecruiterAnalysis } from '@/features/matching/hooks/use-recruiter-analysis';
import './recruiter-analysis.css';
export function AnalysisError({ error }: { error: unknown }) {
  const t = useTranslations('RecruiterAI');
  return error ? <p className="ai-error" role="alert">{t(`errors.${error instanceof ScreeningError ? error.key : 'request'}`)}</p> : null;
}
export function AnalysisProgress({ analysis }: { analysis: ReturnType<typeof useRecruiterAnalysis> }) {
  const t = useTranslations('RecruiterAI'); const { task, progress, start } = analysis;
  return <><AnalysisError error={start.error} />{task && <div className={`ai-progress ai-progress-${task.status}`} aria-label={t(`phases.${analysisPhase(task)}`)}><div className="ai-progress-title"><strong role="status">{t(`phases.${analysisPhase(task)}`)}</strong>{task.progress !== undefined && <span>{task.progress}%</span>}</div><progress max={100} value={task.progress} aria-label={t(`phases.${analysisPhase(task)}`)} />
    {progress.isError ? <div role="alert"><p>{t('progressError')}</p><Button size="sm" variant="outline" onClick={() => void progress.refetch()}>{t('retry')}</Button></div> : task.status === 'failed' ? <p className="ai-error" role="alert">{t(`errors.${analysisErrorKeys[task.error?.code ?? 'AI_ANALYSIS_FAILED'] ?? 'analysisFailed'}`)}</p> : task.status === 'completed' ? <p>{task.type === 'screening' && task.result ? t('completeSummary', task.result) : t('completedMatch')}</p> : null}
  </div>}</>;
}
