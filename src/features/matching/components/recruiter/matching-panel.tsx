'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Check, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMatchingResult, useRecruiterAnalysis } from '@/features/matching/hooks/use-recruiter-analysis';
import { AnalysisError, AnalysisProgress } from '@/features/matching/components/recruiter/analysis-progress';
import type { MatchingResult } from '@/lib/api/analysis-schemas';

export function MatchingSkills({ result }: { result: MatchingResult }) {
  const t = useTranslations('RecruiterAI');
  return <div className="ai-matching-details"><div className="ai-breakdown">{(['skills', 'experience', 'education'] as const).map(key => result.breakdown?.[key] === undefined ? null : <div key={key}><span>{t(key === 'skills' ? 'skillScore' : key === 'experience' ? 'experienceScore' : 'educationScore')}</span><strong>{result.breakdown[key]}%</strong><progress max={100} value={result.breakdown[key]} /></div>)}</div><div className="ai-skill-columns"><section><h3><Check size={14} />{t('matched')}</h3>{result.matchedSkills?.length ? <ul>{result.matchedSkills.map((skill, index) => <li key={`${skill.name}-${index}`}><strong>{skill.name}</strong>{skill.evidence && <p>{skill.evidence}</p>}</li>)}</ul> : <p>{t('noMatched')}</p>}</section><section><h3><CircleAlert size={14} />{t('missing')}</h3>{result.missingSkills?.length ? <ul>{result.missingSkills.map((skill, index) => <li key={`${skill.name}-${index}`}><strong>{skill.name}</strong><small>{t(skill.importance)}</small>{skill.suggestion && <p>{skill.suggestion}</p>}</li>)}</ul> : <p>{t('noMissing')}</p>}</section></div></div>;
}
export function MatchingPanel({ applicationId, cvAvailable = true, compact = false }: { applicationId: string; cvAvailable?: boolean; compact?: boolean }) {
  const t = useTranslations('RecruiterAI'); const query = useMatchingResult(applicationId); const analysis = useRecruiterAnalysis('matching', applicationId);
  const [expanded, setExpanded] = useState(!compact);
  const result = query.data;
  const completed = analysis.task?.status === 'completed' && analysis.task.type === 'matching' ? analysis.task.result : undefined;
  const displayed = query.isError ? undefined : completed && (!result || completed.createdAt >= result.createdAt) ? completed : result;
  return <section className={compact ? 'ai-matching-panel ai-matching-compact' : 'ai-matching-panel'} aria-label={t('matchHeading')}><div className="ai-panel-heading">{!compact && <h2><Sparkles size={16} />{t('matchHeading')}</h2>}<Button size="sm" variant="outline" disabled={!cvAvailable || analysis.busy} onClick={() => analysis.start.mutate()}>{t(analysis.busy ? 'matching' : displayed ? 'matchAgain' : 'match')}</Button></div><AnalysisProgress analysis={analysis} />
    {query.isPending ? <div className="ai-skeleton" aria-busy="true" aria-label={t('loading')} /> : query.isError ? <><AnalysisError error={query.error} /><Button size="sm" variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button></> : displayed ? <><div className="ai-score"><strong>{t('score', { score: displayed.score })}</strong><span>{t('result')}</span></div><p className="ai-explanation">{displayed.explanation || t('noExplanation')}</p><small className="ai-advisory">{t('disclaimer')}</small>{compact && <Button size="sm" variant="ghost" className="ai-detail-toggle" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{t(expanded ? 'hideDetail' : 'detail')}</Button>}{expanded && <MatchingSkills result={displayed} />}</> : <p className="ai-empty">{t(cvAvailable ? 'noMatching' : 'noCv')}</p>}
  </section>;
}
