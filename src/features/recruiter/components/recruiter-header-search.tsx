'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRecruiterJobs } from '@/features/jobs';
import { useRecruiterApplications } from '@/features/applications/hooks/use-recruiter-applications';
import { candidateSearchSchema } from '@/features/applications/schemas/recruiter-applications';
import { CandidateRequestError } from '@/features/applications/errors';

function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const t = useTranslations('Recruiter');
  const candidatesText = useTranslations('Candidates');
  const jobs = useRecruiterJobs();
  const applications = useRecruiterApplications({ q: query, page: 1, pageSize: 5, sort: 'applied_desc' });
  const matchingJobs = jobs.data?.items.filter(job => job.title.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).slice(0, 5) ?? [];
  return <section className="header-search-results" aria-label={t('searchResults')}><div className="header-search-results-heading"><strong>{t('searchResults')}</strong><Button type="button" variant="ghost" size="icon-sm" aria-label={t('closeSearch')} onClick={onClose}><X size={15} /></Button></div><h2>{t('candidates')}</h2>{applications.isPending ? <div className="header-search-skeleton" role="status" aria-label={t('searchLoading')} /> : applications.isError ? <div role="alert"><p>{candidatesText(`errors.${applications.error instanceof CandidateRequestError ? applications.error.messageKey : 'requestFailed'}`)}</p><Button type="button" variant="ghost" size="sm" onClick={() => void applications.refetch()}>{t('searchRetry')}</Button></div> : applications.data?.items.length ? <ul>{applications.data.items.map(application => <li key={application.id}><Link href={`/recruiter/candidates/${application.id}`} onClick={onClose}><strong>{application.candidate.fullName}</strong><small>{application.jobTitle}</small></Link></li>)}</ul> : <p>{t('noCandidateResults')}</p>}<h2>{t('jobs')}</h2>{jobs.isPending ? <div className="header-search-skeleton" role="status" aria-label={t('searchLoading')} /> : jobs.isError ? <div role="alert"><p>{t('searchFailed')}</p><Button type="button" variant="ghost" size="sm" onClick={() => void jobs.refetch()}>{t('searchRetry')}</Button></div> : matchingJobs.length ? <ul>{matchingJobs.map(job => <li key={job.id}><Link href={`/recruiter/jobs/${job.id}`} onClick={onClose}>{job.title}</Link></li>)}</ul> : <p>{t('noJobResults')}</p>}</section>;
}

export function RecruiterHeaderSearch() {
  const t = useTranslations('Recruiter');
  const candidateText = useTranslations('Candidates');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  return <div className="header-search-wrap" onKeyDown={event => { if (event.key === 'Escape') { setSubmitted(null); setInvalid(false); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setSubmitted(null); setInvalid(false); } }}><form className="header-search" role="search" aria-label={t('searchHeader')} onSubmit={event => { event.preventDefault(); const parsed = candidateSearchSchema.safeParse(query); setInvalid(!parsed.success); setSubmitted(parsed.success && parsed.data ? parsed.data : null); }}><Button type="submit" variant="ghost" size="icon-sm" aria-label={t('search')}><Search size={15} /></Button><Input type="search" value={query} maxLength={200} onChange={event => { setQuery(event.target.value); setSubmitted(null); setInvalid(false); }} placeholder={t('searchHeader')} aria-label={t('searchHeader')} aria-invalid={invalid} aria-describedby={invalid ? 'header-search-error' : undefined} aria-expanded={submitted !== null} /></form>{invalid && <p id="header-search-error" className="header-search-validation" role="alert">{candidateText('privateSearch')}</p>}{submitted !== null && <SearchResults key={submitted} query={submitted} onClose={() => setSubmitted(null)} />}</div>;
}
