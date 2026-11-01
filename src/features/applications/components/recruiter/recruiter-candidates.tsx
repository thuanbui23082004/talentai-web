'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, LayoutGrid, List, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRecruiterJobs } from '@/features/jobs';
import { useApplicantCv, useRecruiterApplications } from '@/features/applications/hooks/use-recruiter-applications';
import { applicationStatuses, candidateSearchSchema } from '@/features/applications/schemas/recruiter-applications';
import type { RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';
import { CandidateRequestError } from '@/features/applications/errors';
import { CandidateCard, CandidateCvButton, CandidateDetailLink, CandidateIdentity } from '@/features/applications/components/recruiter/candidate-card';
import { CandidateCvViewer } from '@/features/applications/components/recruiter/candidate-cv-viewer';
import './recruiter-candidates.css';

function CandidateSelect({ label, value, items, onChange }: { label: string; value: string; items: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={next => onChange(next ?? 'all')} items={items}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{items.map(item => <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}
type Filters = { job: string; status: string; experience: string; education: 'all' | NonNullable<RecruiterApplicationQuery['educationLevel']>; sort: 'applied_desc' | 'applied_asc' | 'experience_desc'; page: number };
const defaults: Filters = { job: 'all', status: 'all', experience: 'all', education: 'all', sort: 'applied_desc', page: 1 };

export function RecruiterCandidates() {
  const t = useTranslations('Candidates');
  const pipelineText = useTranslations('Pipeline');
  const educationText = useTranslations('JobForm.educationLevels');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [filters, setFilters] = useState<Filters>(defaults);
  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState('');
  const [skills, setSkills] = useState('');
  const [debounced, setDebounced] = useState({ search: '', skills: '' });
  const [activeCv, setActiveCv] = useState<string | null>(null);
  const cv = useApplicantCv();
  const jobs = useRecruiterJobs();
  useEffect(() => { const timeout = setTimeout(() => setDebounced({ search, skills }), 300); return () => clearTimeout(timeout); }, [search, skills]);
  const rawSearch = candidateSearchSchema.safeParse(search);
  const rawSkills = candidateSearchSchema.safeParse(skills);
  const safeSearch = candidateSearchSchema.safeParse(debounced.search);
  const safeSkills = candidateSearchSchema.safeParse(debounced.skills);
  const valid = rawSearch.success && rawSkills.success && safeSearch.success && safeSkills.success;
  const query: RecruiterApplicationQuery = {
    q: safeSearch.success ? safeSearch.data || undefined : undefined,
    skills: safeSkills.success && safeSkills.data ? safeSkills.data.split(',').map(value => value.trim()).filter(Boolean) : undefined,
    jobId: filters.job === 'all' ? undefined : filters.job,
    status: filters.status === 'all' ? undefined : [filters.status as typeof applicationStatuses[number]],
    minExperienceYears: filters.experience === 'all' ? undefined : Number(filters.experience),
    educationLevel: filters.education === 'all' ? undefined : filters.education,
    sort: filters.sort, page: filters.page, pageSize: 9,
  };
  const applications = useRecruiterApplications(query, valid);
  const data = applications.data;
  function update<K extends keyof Filters>(key: K, value: Filters[K]) { setFilters(current => ({ ...current, [key]: value, page: 1 })); }
  function clear() { setSearch(''); setSkills(''); setDebounced({ search: '', skills: '' }); setFilters(defaults); }
  function viewCv(id: string) { cv.reset(); setActiveCv(id); cv.mutate(id); }
  const total = data?.meta.totalItems ?? 0;
  const pages = data?.meta.totalPages ?? 0;
  const current = filters.page;
  const pageNumbers = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => current - 2 + index), pages])].filter(page => page >= 1 && page <= pages).sort((a, b) => a - b);
  const searchError = !rawSearch.success || !rawSkills.success;
  return <div className="candidates-page">
    <header className="candidates-page-heading"><div><h1>{t('heading')}</h1><p>{t('subtitle')}</p></div><div className="candidate-heading-actions"><Link className="candidate-pipeline-link" href="/recruiter/candidates/pipeline">{pipelineText('board')}</Link><div className="candidate-view-toggle"><Button size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')} aria-pressed={view === 'list'}><List size={13} />{t('list')}</Button><Button size="sm" variant={view === 'cards' ? 'default' : 'outline'} onClick={() => setView('cards')} aria-pressed={view === 'cards'}><LayoutGrid size={13} />{t('cards')}</Button></div></div></header>
    <section className="candidates-toolbar" aria-label={t('filter')}><div className="candidates-toolbar-top"><strong>{t('total', { count: total })}</strong><div className="candidate-search"><Search size={14} /><Input value={search} maxLength={200} onChange={event => { setSearch(event.target.value); update('page', 1); }} placeholder={t('search')} aria-label={t('searchLabel')} aria-invalid={!rawSearch.success} aria-describedby={searchError ? 'candidate-search-error' : undefined} /></div><Button variant="outline" size="sm" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={13} />{t('filter')}</Button><CandidateSelect label={t('sort')} value={filters.sort} onChange={value => update('sort', value as Filters['sort'])} items={(['applied_desc', 'applied_asc', 'experience_desc'] as const).map(value => ({ value, label: t(`sorts.${value}`) }))} /></div>
      {showFilters && <div className="candidates-filter-row"><CandidateSelect label={t('job')} value={filters.job} items={[{ value: 'all', label: t('allJobs') }, ...(jobs.data?.items ?? []).map(job => ({ value: job.id, label: job.title }))]} onChange={value => update('job', value)} /><CandidateSelect label={t('status')} value={filters.status} items={[{ value: 'all', label: t('allStatuses') }, ...applicationStatuses.map(value => ({ value, label: t(`statuses.${value}`) }))]} onChange={value => update('status', value)} /><Input value={skills} maxLength={200} aria-label={t('skills')} placeholder={t('skillsPlaceholder')} onChange={event => { setSkills(event.target.value); update('page', 1); }} aria-invalid={!rawSkills.success} /><CandidateSelect label={t('experience')} value={filters.experience} items={[{ value: 'all', label: t('allExperiences') }, ...[1, 2, 3, 5].map(count => ({ value: String(count), label: t('experienceYears', { count }) }))]} onChange={value => update('experience', value)} /><CandidateSelect label={t('education')} value={filters.education} onChange={value => update('education', value as Filters['education'])} items={[{ value: 'all', label: t('allEducation') }, ...(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other'] as const).map(value => ({ value, label: educationText(value) }))]} /><Button variant="ghost" size="sm" onClick={clear}><RotateCcw size={12} />{t('clear')}</Button></div>}

      {searchError && <p role="alert" id="candidate-search-error" className="candidate-error">{t(search.length > 200 || skills.length > 200 ? 'searchTooLong' : 'privateSearch')}</p>}
      {jobs.isError && <p className="candidate-filter-error" role="alert">{t('errors.requestFailed')} <Button variant="ghost" size="sm" onClick={() => void jobs.refetch()}>{t('retry')}</Button></p>}
    </section>
    {activeCv && <CandidateCvViewer key={activeCv} blob={cv.data} loading={cv.isPending} error={cv.error} onClose={() => { setActiveCv(null); cv.reset(); }} onRetry={() => cv.mutate(activeCv)} />}
    {applications.isError ? <section className="candidate-empty" role="alert"><h2>{t(`errors.${applications.error instanceof CandidateRequestError ? applications.error.messageKey : 'requestFailed'}`)}</h2><Button variant="outline" onClick={() => void applications.refetch()}>{t('retry')}</Button></section>
      : applications.isPending && valid ? <div className="candidate-card-grid candidate-skeleton" aria-busy="true">{Array.from({ length: 9 }, (_, index) => <span key={index} />)}</div>
      : !data?.items.length ? <section className="candidate-empty"><h2>{t('empty')}</h2><p>{t('emptyHint')}</p><Button variant="outline" onClick={clear}>{t('clear')}</Button></section>
      : <section aria-busy={applications.isFetching} aria-label={t('heading')} className={applications.isPlaceholderData ? 'candidate-results-updating' : ''}>{applications.isFetching && <p className="candidate-updating" role="status">{t('updating')}</p>}{view === 'cards' ? <div className="candidate-card-grid">{data.items.map(application => <CandidateCard application={application} key={application.id} onView={viewCv} busy={cv.isPending} />)}</div> : <div className="candidate-table-container"><table className="candidates-list-table"><thead><tr>{(['candidate', 'position', 'reference', 'appliedAt', 'status', 'actions'] as const).map(key => <th key={key}>{t(key)}</th>)}</tr></thead><tbody>{data.items.map(application => <tr key={application.id}><td><CandidateIdentity application={application} /></td><td>{application.jobTitle || t('unknownPosition')}</td><td className="candidate-reference" title={application.id}>{application.id.slice(-8)}</td><td>{new Intl.DateTimeFormat('vi', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(application.appliedAt))}</td><td><span className={`candidate-status status-${application.status}`}><span />{t(`statuses.${application.status}`)}</span></td><td><div className="candidate-table-actions"><CandidateDetailLink application={application} /><CandidateCvButton application={application} busy={cv.isPending} onView={viewCv} /></div></td></tr>)}</tbody></table></div>}</section>}
    <footer className="candidates-results-footer"><span>{t('range', { from: data?.items.length ? (current - 1) * 9 + 1 : 0, to: data?.items.length ? (current - 1) * 9 + data.items.length : 0, total })}</span><nav aria-label={t('pagination')}><Button variant="ghost" size="sm" disabled={current <= 1 || applications.isFetching} onClick={() => setFilters(value => ({ ...value, page: value.page - 1 }))}><ChevronLeft size={12} />{t('previous')}</Button>{pageNumbers.map((page, index) => <span key={page}>{index > 0 && page > pageNumbers[index - 1] + 1 && <span className="candidate-pagination-gap">…</span>}<Button size="icon-sm" variant={current === page ? 'default' : 'ghost'} aria-label={t('page', { page })} aria-current={current === page ? 'page' : undefined} disabled={applications.isFetching} onClick={() => setFilters(value => ({ ...value, page }))}>{page}</Button></span>)}<Button variant="ghost" size="sm" disabled={current >= pages || applications.isFetching} onClick={() => setFilters(value => ({ ...value, page: value.page + 1 }))}>{t('next')}<ChevronRight size={12} /></Button></nav></footer>
  </div>;
}
