'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { BriefcaseBusiness, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminKeys } from '@/features/admin/query-keys';
import { getAdminJobs } from '@/features/admin/services/jobs';
import { jobStatuses } from '@/features/admin/schemas/jobs';
import { filterAdminJobs } from '@/features/admin/job-rules';
import { useAdminJobsNotice } from '@/features/admin/jobs-ui-store';
import { JobState, AdminJobBadge } from '@/features/admin/components/jobs-shared';
export function AdminJobs() {
  const t = useTranslations('AdminJobs'); const a = useTranslations('Admin'); const f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.jobs, queryFn: ({ signal }) => getAdminJobs(signal), retry: false });
  const [search, setSearch] = useState(''); const [companyId, setCompanyId] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const notice = useAdminJobsNotice(s => s.deleted); const setNotice = useAdminJobsNotice(s => s.setDeleted);
  const jobs = query.data ?? []; const rows = filterAdminJobs(jobs, search, companyId, status); const pages = Math.max(1, Math.ceil(rows.length / 10)); const current = Math.min(page, pages); const items = rows.slice((current - 1) * 10, current * 10);
  const companies = [...new Map(jobs.map(job => [job.company.id, job.company])).values()];
  return <div className="admin-users-page"><div className="admin-users-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{a('refresh')}</Button></div>
    {notice && <div className="admin-user-notice" role="status"><span>{t('deleteSuccess')}</span><Button variant="ghost" size="icon" aria-label={t('closeNotice')} onClick={() => setNotice(false)}><X size={17} /></Button></div>}
    <div className="admin-user-summary"><BriefcaseBusiness size={20} /><span>{t('total')}</span><strong>{query.isPending ? '—' : f.number(jobs.length)}</strong></div>
    <div className="admin-user-filters"><label className="admin-user-search" htmlFor="admin-job-search"><span>{t('search')}</span><Input id="admin-job-search" type="search" autoComplete="off" placeholder={t('searchPlaceholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label><label htmlFor="admin-job-company"><span>{t('company')}</span><select id="admin-job-company" aria-label={t('company')} value={companyId} onChange={e => { setCompanyId(e.target.value); setPage(1); }}><option value="">{t('allCompanies')}</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label htmlFor="admin-job-status"><span>{t('status')}</span><select id="admin-job-status" aria-label={t('status')} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">{t('allStatuses')}</option>{jobStatuses.map(value => <option key={value} value={value}>{t(`statuses.${value}`)}</option>)}</select></label><Button variant="ghost" onClick={() => { setSearch(''); setCompanyId(''); setStatus(''); setPage(1); }}>{t('clear')}</Button></div>
    <JobState pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.error && (items.length ? <><div className="admin-table-scroll"><table className="admin-jobs-table"><thead><tr>{(['jobTitle', 'company', 'location', 'status', 'created', 'actions'] as const).map(key => <th scope="col" key={key}>{t(key)}</th>)}</tr></thead><tbody>{items.map(job => <tr key={job.id}><td><Link className="admin-user-name" href={`/admin/jobs/${job.id}`}>{job.title}</Link></td><td>{job.company.name}</td><td>{job.location.city}</td><td><AdminJobBadge status={job.status} /></td><td>{job.createdAt ? f.dateTime(new Date(job.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' }) : t('noValue')}</td><td><Link className="admin-text-link" href={`/admin/jobs/${job.id}`}>{t('view')}</Link></td></tr>)}</tbody></table></div><div className="admin-user-pagination"><span>{t('count', { count: rows.length })}</span><Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>{t('previous')}</Button><span>{t('page', { page: current, pages })}</span><Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>{t('next')}</Button></div></> : <div className="admin-state"><p>{t(jobs.length ? 'empty' : 'noJobs')}</p>{jobs.length > 0 && <p>{t('emptyHint')}</p>}</div>)}
  </div>;
}
