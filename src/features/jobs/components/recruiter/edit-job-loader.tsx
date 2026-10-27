'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRecruiterJob } from '@/features/jobs/hooks/use-create-job';
import { JobDataState } from '@/features/jobs/components/recruiter/job-data-state';
import { CreateJobForm } from '@/features/jobs/components/recruiter/create-job-form';
export function EditJobLoader({ id }: { id: string }) {
  const t = useTranslations('JobForm'); const query = useRecruiterJob(id);
  if (query.isPending || query.isError || !query.data) return <JobDataState loading={query.isPending} error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data.status === 'locked') return <section className="recruiter-panel empty-state" role="alert"><h1>{t('editHeading')}</h1><p>{t('editLocked')}</p><Link href={`/recruiter/jobs/${id}`}>{t('back')}</Link></section>;
  return <CreateJobForm key={id} job={query.data} />;
}
