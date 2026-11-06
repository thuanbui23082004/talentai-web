'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, LayoutGrid, List, MapPin, Plus, SlidersHorizontal, Wallet } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useRecruiterJobs, toRecruiterJobView, JobDataState } from '@/features/jobs';
import { postingStatuses, postingStatusLabels, type PostingStatus } from '@/lib/jobs/recruiter-filters';
import './recruiter-job-filters.css';

export function RecruiterJobs({ status, page = 1 }: { status?: PostingStatus; page?: number }) {
  const t = useTranslations('Recruiter');
  const router = useRouter();
  const query = useRecruiterJobs({ status, page, pageSize: 8 });
  const [grid, setGrid] = useState(true);
  const jobs = query.data?.items.map(toRecruiterJobView) ?? [];
  const meta = query.data?.meta;

  function navigate(nextStatus: PostingStatus | undefined, nextPage = 1) {
    const params = new URLSearchParams();
    if (nextStatus) params.set('status', nextStatus);
    if (nextPage > 1) params.set('page', String(nextPage));
    router.push(`/recruiter/jobs${params.size ? `?${params}` : ''}`, { scroll: false });
  }

  return <div className="jobs-page">
    <div className="jobs-page-heading">
      <div><h1>{t('jobTitle')}</h1><p>{t('jobSubtitle')}</p></div>
      <Button nativeButton={false} render={<Link href="/recruiter/jobs/new" />}><Plus size={16} />{t('post')}</Button>
    </div>
    <section className="recruiter-panel recruiter-job-filters" aria-labelledby="job-status-filter-title">
      <h2 id="job-status-filter-title"><SlidersHorizontal size={16} aria-hidden="true" />{t('filterStatus')}</h2>
      <div className="recruiter-job-filter-options" role="group" aria-label={t('filterStatus')}>
        <Button variant={!status ? 'default' : 'outline'} aria-pressed={!status} onClick={() => navigate(undefined)}>{t('allStatuses')}</Button>
        {postingStatuses.map(value => <Button key={value} variant={status === value ? 'default' : 'outline'} aria-pressed={status === value} onClick={() => navigate(value)}>{postingStatusLabels[value]}</Button>)}
      </div>
      {query.isSuccess && <div className="recruiter-job-filter-summary">
        <span role="status">{t('results', { count: meta?.totalItems ?? 0 })}</span>
        <div>
          <Button size="icon" variant={grid ? 'default' : 'outline'} aria-label={t('grid')} aria-pressed={grid} onClick={() => setGrid(true)}><LayoutGrid size={16} /></Button>
          <Button size="icon" variant={!grid ? 'default' : 'outline'} aria-label={t('list')} aria-pressed={!grid} onClick={() => setGrid(false)}><List size={16} /></Button>
        </div>
      </div>}
    </section>
    {query.isPending || query.isError ? <JobDataState loading={query.isPending} error={query.error} onRetry={() => void query.refetch()} /> : <>
      {jobs.length ? <div className={`job-card-grid ${grid ? '' : 'list-view'}`}>
        {jobs.map(job => <Link className="recruiter-panel job-card recruiter-job-card-link" key={job.id} href={`/recruiter/jobs/${job.id}`} aria-label={`${t('detail')}: ${job.title}`}>
          <div className={`company-monogram monogram-${job.initials.toLowerCase()}`} aria-hidden="true">{job.initials}<span>GROUP</span></div>
          <div className="job-card-content">
            <div className="job-card-title"><h2 title={job.title}>{job.title}</h2><span className={`job-status ${job.status === 'draft' ? 'draft-status' : ''}`}><span className="status-dot" />{job.postingStatus ? postingStatusLabels[job.postingStatus] : t(job.status)}</span></div>
            <p className="company-name">{job.company}</p>
            <div className="job-card-meta">
              <span className="job-salary"><Wallet size={12} />{job.salary === 'negotiable' ? t('negotiable') : job.salary}</span>
              <span><MapPin size={12} />{job.location}</span><span><Clock3 size={12} />{t(job.type)}</span>
            </div>
            <div className="job-card-footer"><small>{t('updated', { hours: job.hours })}</small><span className={buttonVariants({ variant: 'outline', size: 'sm' })}>{t('detail')}</span></div>
          </div>
        </Link>)}
      </div> : <section className="recruiter-panel empty-state"><BriefcaseBusiness size={32} /><h2>{t('empty')}</h2><p>{t('statusEmptyHint')}</p>{status && <Button variant="outline" onClick={() => navigate(undefined)}>{t('allStatuses')}</Button>}</section>}
      {meta && meta.totalPages > 1 && <nav className="jobs-pagination" aria-label={t('jobs')}>
        <Button variant="outline" size="icon" disabled={page <= 1} aria-label={t('previous')} onClick={() => navigate(status, page - 1)}><ChevronLeft size={16} /></Button>
        <span>{t('pageOf', { page, total: meta.totalPages })}</span>
        <Button variant="outline" size="icon" disabled={page >= meta.totalPages} aria-label={t('next')} onClick={() => navigate(status, page + 1)}><ChevronRight size={16} /></Button>
      </nav>}
    </>}
  </div>;
}
