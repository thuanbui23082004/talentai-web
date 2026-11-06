'use client';

import { FileCheck2, Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toRecruiterJobView } from '../../job-view';
import type { RecruiterJob } from '../../types';
import { JobManagementActions } from './job-management-actions';
import './create-job.css';

export function JobCreatedSuccess({ job, onPublished }: { job: RecruiterJob; onPublished: (job: RecruiterJob) => void }) {
  const t = useTranslations('JobForm');
  return <section className="job-created-success" aria-labelledby="job-created-title">
    <div className="job-created-icon"><FileCheck2 size={52} strokeWidth={1.4} aria-hidden="true" /></div>
    <h1 id="job-created-title">{job.title}</h1>
    <p className="job-created-description">{t('createdSuccess')}</p>
    <JobManagementActions job={toRecruiterJobView(job)} created onPublished={onPublished} />
    {job.status === 'draft' && <p className="job-created-tip"><Lightbulb size={18} aria-hidden="true" />{t('createdTip')}</p>}
  </section>;
}
