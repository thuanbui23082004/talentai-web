'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { candidateSearchSchema } from '@/lib/api/application-schemas';
import { useRankedApplications, useRecommendedCandidates, useRecruiterAnalysis } from '@/features/matching/hooks/use-recruiter-analysis';
import { AnalysisError, AnalysisProgress } from '@/features/matching/components/recruiter/analysis-progress';
import { MatchingPanel } from '@/features/matching/components/recruiter/matching-panel';

function FilterChoice({ label, value, items, change }: { label: string; value: string; items: { value: string; label: string }[]; change: (value: string) => void }) {
  return <Select value={value} items={items} onValueChange={value => change(value ?? '')}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}
function ScreeningContent({ jobId }: { jobId: string }) {
  const t = useTranslations('RecruiterAI'); const jobText = useTranslations('JobForm'); const statuses = useTranslations('Candidates.statuses');
  const analysis = useRecruiterAnalysis('screening', jobId);
  const [tab, setTab] = useState<'ranking' | 'recommended'>('ranking');
  const [search, setSearch] = useState(''); const [debounced, setDebounced] = useState(''); const [page, setPage] = useState(1);
  const [education, setEducation] = useState<'' | 'high_school' | 'vocational' | 'college' | 'bachelor' | 'master' | 'doctorate' | 'other'>('');
  const [experience, setExperience] = useState('');
  useEffect(() => { const timer = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer); }, [search]);
  const raw = candidateSearchSchema.safeParse(search); const parsed = candidateSearchSchema.safeParse(debounced); const valid = raw.success && parsed.success;
  const ranked = useRankedApplications(jobId, { q: parsed.success ? parsed.data || undefined : undefined, sort: 'match_score_desc', page, pageSize: 5, educationLevel: education || undefined, minExperienceYears: experience ? Number(experience) : undefined }, valid);
  const recommendations = useRecommendedCandidates(jobId);
  const list = ranked.data;
  return <div className="ai-screening-content"><div className="ai-screening-toolbar"><div className="ai-view-tabs"><Button size="sm" variant={tab === 'ranking' ? 'default' : 'outline'} aria-pressed={tab === 'ranking'} onClick={() => setTab('ranking')}>{t('ranking')}</Button><Button size="sm" variant={tab === 'recommended' ? 'default' : 'outline'} aria-pressed={tab === 'recommended'} onClick={() => setTab('recommended')}>{t('recommended')}</Button></div><Button className="ai-run-button" disabled={analysis.busy} onClick={() => analysis.start.mutate()}><Sparkles size={14} />{t(analysis.busy ? 'running' : analysis.task ? 'rerun' : 'run')}</Button></div>
    <AnalysisProgress analysis={analysis} />
    {tab === 'ranking' ? <><div className="ai-filters"><Input aria-label={t('search')} placeholder={t('searchPlaceholder')} value={search} maxLength={200} aria-invalid={!raw.success} onChange={event => { setSearch(event.target.value); setPage(1); }} /><FilterChoice label={t('education')} value={education} change={value => { setEducation(value as typeof education); setPage(1); }} items={[{ value: '', label: t('allEducation') }, ...(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other'] as const).map(value => ({ value, label: jobText(`educationLevels.${value}`) }))]} /><FilterChoice label={t('experience')} value={experience} change={value => { setExperience(value); setPage(1); }} items={[{ value: '', label: t('allExperience') }, ...[1, 2, 3, 5].map(count => ({ value: String(count), label: t('years', { count }) }))]} /><Button size="sm" variant="ghost" onClick={() => { setSearch(''); setDebounced(''); setEducation(''); setExperience(''); setPage(1); }}>{t('clear')}</Button></div>
      {!valid ? <p className="ai-error" role="alert">{t('privateSearch')}</p> : ranked.isPending ? <div className="ai-skeleton" aria-label={t('loading')} aria-busy="true" /> : ranked.isError ? <><AnalysisError error={ranked.error} /><Button size="sm" variant="outline" onClick={() => void ranked.refetch()}>{t('retry')}</Button></> : !list?.items.length ? <p className="ai-empty">{t('empty')}</p> : <><div className="ai-ranking-count">{t('total', { count: list.meta.totalItems })}{ranked.isFetching && <span role="status">{t('loading')}</span>}</div><ol className="ai-ranked-list" start={(page - 1) * 5 + 1}>{list.items.map((application, index) => <li key={application.id} data-application-id={application.id}><div className="ai-ranked-person"><span className="ai-rank-number">{application.matchScore === undefined ? '—' : (page - 1) * 5 + index + 1}</span><div><Link href={`/recruiter/candidates/${application.id}`} aria-label={t('viewProfileFor', { name: application.candidate.fullName })}>{application.candidate.fullName}</Link><p>{application.candidate.headline || application.jobTitle}</p><small>{statuses(application.status)}</small></div></div><MatchingPanel applicationId={application.id} compact cvAvailable={!!application.cvId} /></li>)}</ol><nav className="ai-pagination" aria-label={t('ranking')}><Button size="sm" variant="outline" disabled={page <= 1 || ranked.isFetching} onClick={() => setPage(value => value - 1)}>{t('previous')}</Button><span>{t('page', { page, total: Math.max(1, list.meta.totalPages) })}</span><Button size="sm" variant="outline" disabled={page >= list.meta.totalPages || ranked.isFetching} onClick={() => setPage(value => value + 1)}>{t('next')}</Button></nav></>}
    </> : recommendations.isPending ? <div className="ai-skeleton" aria-busy="true" aria-label={t('loading')} /> : recommendations.isError ? <><AnalysisError error={recommendations.error} /><Button size="sm" variant="outline" onClick={() => void recommendations.refetch()}>{t('retry')}</Button></> : !recommendations.data?.items.length ? <p className="ai-empty">{t('noRecommended')}</p> : <div className="ai-recommended-list">{recommendations.data.items.map(item => <article key={item.application.id}><div className="ai-recommended-title"><Link href={`/recruiter/candidates/${item.application.id}`}>{item.application.candidate.fullName}</Link><strong>{t('score', { score: item.score })}</strong></div><p>{item.application.candidate.headline || item.application.jobTitle}</p>{item.reasons?.length ? <ul>{item.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul> : <p>{t('noExplanation')}</p>}<small className="ai-advisory">{t('disclaimer')}</small><Link className="ai-profile-link" href={`/recruiter/candidates/${item.application.id}`}>{t('viewProfile')}</Link></article>)}</div>}
  </div>;
}
export function RecruiterScreening({ jobId }: { jobId: string }) {
  const t = useTranslations('RecruiterAI'); const [open, setOpen] = useState(false);
  return <section className="ai-screening-section"><header className="ai-section-header"><h2><Sparkles size={18} />{t('heading')}</h2><Button size="sm" variant="outline" aria-expanded={open} onClick={() => setOpen(value => !value)}>{t(open ? 'close' : 'open')}<ChevronDown size={14} /></Button></header>{open && <ScreeningContent jobId={jobId} />}</section>;
}
