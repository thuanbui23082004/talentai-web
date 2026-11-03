'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/shared/search-bar';
import { Select } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, LayoutGrid, List, MapPin, Plus, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecruiterJobs, toRecruiterJobView, JobDataState, LocationPicker } from '@/features/jobs';

export function RecruiterJobs({ initialQuery = '', initialLocation = '' }: { initialQuery?: string; initialLocation?: string }) {
  const t = useTranslations('Recruiter');
  const jobsQuery = useRecruiterJobs();
  const jobs = jobsQuery.data?.items.map(toRecruiterJobView) ?? [];
  const [searchRevision, setSearchRevision] = useState(0);
  const [search, setSearch] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [experience, setExperience] = useState('');
  const [type, setType] = useState('');
  const [salary, setSalary] = useState('');
  const [quick, setQuick] = useState(false);
  const [sort, setSort] = useState('newest');
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const filtered = jobs.filter(job => `${job.title} ${job.company}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) && (!location || job.location === location) && (!type || job.type === type) && (!experience || (experience === 'junior' ? job.experience < 2 : job.experience >= 2)) && (!salary || job.salary === salary) && (!quick || job.hours <= 5)).sort((a, b) => sort === 'titleSort' ? a.title.localeCompare(b.title, 'vi') : a.hours - b.hours);
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  function clear() { setSearchRevision(value => value + 1); setSearch(''); setLocation(''); setExperience(''); setType(''); setSalary(''); setQuick(false); setPage(1); }
  if (!jobsQuery.data) return <JobDataState loading={jobsQuery.isPending} error={jobsQuery.error} onRetry={() => void jobsQuery.refetch()} />;
  return <div className="jobs-page"><div className="jobs-page-heading"><div><h1>{t('jobTitle')}</h1><p>{t('jobSubtitle')}</p></div><Button nativeButton={false} render={<Link href="/recruiter/jobs/new" />}><Plus size={16} />{t('post')}</Button></div>
    <section className="mb-6">
      <SearchBar
        key={searchRevision}
        locations={[]}
        defaultQuery={search}
        defaultLocation={location}
        queryLabel={t('searchPlaceholder')}
        renderLocation={({ value, onChange }) => <LocationPicker aria-label={t('locationLabel')} value={value} onValueChange={onChange} allowAll />}
        onLocationChange={({ location }) => { setLocation(location); setPage(1); }}
        onSearch={({ query, location }) => { setSearch(query); setLocation(location); setPage(1); }}
        onReset={clear}
        filters={<>
          <Button variant={quick ? 'secondary' : 'outline'} aria-pressed={quick} onClick={() => { setQuick(!quick); setPage(1); }}><Zap size={14} />{t('quick')}</Button>
          <Select aria-label={t('experience')} placeholder={t('experience')} value={experience} onValueChange={value => { setExperience(value ?? ''); setPage(1); }} options={[{ value: '', label: t('experience') }, { value: 'junior', label: t('junior') }, { value: 'senior', label: t('senior') }]} className="w-full sm:w-auto sm:min-w-40" />
          <Select aria-label={t('salary')} placeholder={t('salary')} value={salary} onValueChange={value => { setSalary(value ?? ''); setPage(1); }} options={[{ value: '', label: t('salary') }, ...[...new Set(jobs.map(job => job.salary))].map(value => ({ value, label: value === 'negotiable' ? t('negotiable') : value }))]} className="w-full sm:w-auto sm:min-w-40" />
          <Select aria-label={t('type')} placeholder={t('type')} value={type} onValueChange={value => { setType(value ?? ''); setPage(1); }} options={[{ value: '', label: t('type') }, { value: 'fullTime', label: t('fullTime') }, { value: 'partTime', label: t('partTime') }]} className="w-full sm:w-auto sm:min-w-40" />
        </>}
      />
    </section>
    <div className="results-toolbar"><span>{t('results', { count: filtered.length })}</span><div><label className="sort-label">{t('sort')}<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t('newest')}</option><option value="titleSort">{t('titleSort')}</option></select></label><Button size="icon-sm" variant={grid ? 'default' : 'outline'} aria-label={t('grid')} aria-pressed={grid} onClick={() => setGrid(true)}><LayoutGrid size={14} /></Button><Button size="icon-sm" variant={!grid ? 'default' : 'outline'} aria-label={t('list')} aria-pressed={!grid} onClick={() => setGrid(false)}><List size={15} /></Button></div></div>
    {filtered.length ? <div className={`job-card-grid ${grid ? '' : 'list-view'}`}>{filtered.slice((currentPage - 1) * 8, currentPage * 8).map(job => <article className="recruiter-panel job-card" key={job.id}><div className={`company-monogram monogram-${job.initials.toLowerCase()}`} aria-hidden="true">{job.initials}<span>GROUP</span></div><div className="job-card-content"><div className="job-card-title"><h2 title={job.title}>{job.title}</h2><span className={`job-status ${job.status === 'draft' ? 'draft-status' : ''}`}><span className="status-dot" />{t(job.status)}</span></div><p className="company-name">{job.company}</p><div className="job-card-meta"><span className="job-salary"><Wallet size={12} />{job.salary === 'negotiable' ? t('negotiable') : job.salary}</span><span><MapPin size={11} />{job.location}</span><span><Clock3 size={11} />{t(job.type)}</span></div><div className="job-card-footer"><small>{t('updated', { hours: job.hours })}</small><Button nativeButton={false} render={<Link href={`/recruiter/jobs/${job.id}`} />} variant="outline" size="sm" className="detail-card-link">{t('detail')}</Button></div></div></article>)}</div> : <section className="recruiter-panel empty-state"><BriefcaseBusiness size={32} /><h2>{t('empty')}</h2><p>{t('emptyHint')}</p><Button variant="outline" onClick={clear}>{t('clear')}</Button></section>}
    <nav className="jobs-pagination" aria-label={t('jobs')}><Button variant="outline" size="icon-sm" disabled={currentPage === 1} aria-label={t('previous')} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={15} /></Button>{Array.from({ length: pages }, (_, i) => <Button key={i} variant={currentPage === i + 1 ? 'default' : 'outline'} size="icon-sm" aria-current={currentPage === i + 1 ? 'page' : undefined} onClick={() => setPage(i + 1)}>{i + 1}</Button>)}<Button variant="outline" size="icon-sm" disabled={currentPage === pages} aria-label={t('next')} onClick={() => setPage(currentPage + 1)}><ChevronRight size={15} /></Button></nav>
  </div>;
}
