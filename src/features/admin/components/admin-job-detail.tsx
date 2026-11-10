'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { adminKeys } from '@/features/admin/query-keys';
import { getAdminJob } from '@/features/admin/services/jobs';
import { jobActions, type JobAction } from '@/features/admin/schemas/jobs';
import { canModerateJob } from '@/features/admin/job-rules';
import { JobState, AdminJobBadge } from '@/features/admin/components/jobs-shared';
import { JobModerationForm } from '@/features/admin/components/job-moderation-form';
export function AdminJobDetail({ jobId }: { jobId: string }) {
  const t = useTranslations('AdminJobs'); const f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.job(jobId), queryFn: ({ signal }) => getAdminJob(jobId, signal), retry: false });
  const [action, setAction] = useState<JobAction | null>(null); const [success, setSuccess] = useState(false); const job = query.data;
  const date = (value?: string) => value ? f.dateTime(new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value), { day: '2-digit', month: '2-digit', year: 'numeric' }) : t('noValue');
  function salaryText() {
    const salary = job?.salary;
    if (!salary) return t('noValue'); if (salary.negotiable) return t('negotiable');
    const money = (value: number) => salary.currency === 'VND' ? formatVND(value) : f.number(value, { style: 'currency', currency: 'USD' });
    const amount = salary.min !== undefined && salary.max !== undefined ? t('salaryRange', { min: money(salary.min), max: money(salary.max) }) : salary.min !== undefined ? t('salaryFrom', { amount: money(salary.min) }) : salary.max !== undefined ? t('salaryTo', { amount: money(salary.max) }) : '';
    return amount ? t(salary.period === 'year' ? 'salaryYear' : 'salaryMonth', { amount }) : t('noValue');
  }
  return <div className="admin-users-page"><Link className="admin-user-back" href="/admin/jobs"><ArrowLeft size={17} />{t('back')}</Link><JobState pending={query.isPending} error={query.error} retry={query.refetch} />
    {job && !query.error && <><div className="admin-users-heading"><div><h1>{t('detail')}</h1><p>{job.title}</p></div><AdminJobBadge status={job.status} /></div>{success && <p className="admin-user-notice" role="status"><ShieldCheck size={18} />{t('success')}</p>}
      <section className="admin-user-info"><h2>{t('overview')}</h2><dl className="admin-user-fields">{[{ key: 'jobTitle', value: job.title }, { key: 'company', value: job.company.name }, { key: 'location', value: [job.location.city, job.location.district, job.location.address].filter(Boolean).join(', ') }, { key: 'workType', value: t(`workTypes.${job.workType}`) }, { key: 'level', value: t(`levels.${job.level}`) }, { key: 'salary', value: salaryText() }, { key: 'headcount', value: job.headcount === undefined ? undefined : f.number(job.headcount) }, { key: 'created', value: date(job.createdAt) }, { key: 'deadline', value: date(job.applicationDeadline) }].map(({ key, value }) => <div key={key}><dt>{t(key)}</dt><dd>{value || t('noValue')}</dd></div>)}</dl><Link className="admin-text-link admin-job-company-link" href={`/admin/companies/${job.company.id}`}>{t('companyDetail')}</Link></section>
      {(['description', 'requirements', 'benefits'] as const).map(key => job[key] ? <section key={key} className="admin-user-info"><h2>{t(key)}</h2><p className="admin-job-content">{job[key]}</p></section> : null)}
      {!!job.skills?.length && <section className="admin-user-info"><h2>{t('skills')}</h2><ul className="admin-job-skills">{job.skills.map((skill, i) => <li key={`${skill}-${i}`}>{skill}</li>)}</ul></section>}
      {job.moderation?.reason && <section className="admin-job-moderation-note"><strong>{t('moderationReason')}</strong><p>{job.moderation.reason}</p></section>}
      {!action && <div className="admin-access-buttons">{jobActions.filter(value => canModerateJob(job.status, value)).map(value => <Button key={value} variant={value === 'delete' || value === 'lock' || value === 'reject' ? 'destructive' : 'default'} onClick={() => { setSuccess(false); setAction(value); }}>{t(value)}</Button>)}</div>}
      {action && <JobModerationForm key={`${job.id}-${action}`} job={job} action={action} close={() => setAction(null)} saved={() => setSuccess(true)} />}
      <section className="admin-user-info"><h2>{t('history')}</h2>{job.history?.length ? <ol className="admin-user-history">{job.history.map((entry, i) => <li key={`${entry.at}-${i}`}><ShieldCheck size={18} /><div><strong>{t(jobActions.includes(entry.action as JobAction) ? entry.action : 'otherAction')}</strong><p>{t('actor')}: {entry.actorName || t('noValue')}</p>{entry.reason && <p className="admin-history-reason">{t('reason')}: {entry.reason}</p>}<time dateTime={entry.at}>{f.dateTime(new Date(entry.at), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div></li>)}</ol> : <p className="admin-user-history-empty">{t('noHistory')}</p>}</section>
    </>}
  </div>;
}
