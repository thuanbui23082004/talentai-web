'use client';
import { useRecruiterJob } from '@/features/jobs/hooks/use-create-job';
import { toRecruiterJobView } from '@/features/jobs/job-view';
import { JobDataState } from '@/features/jobs/components/recruiter/job-data-state';
import { RecruiterJobDetail } from '@/features/recruiter';
export function JobDetailLoader({ id }: { id: string }) {
  const query = useRecruiterJob(id);
  if (query.isError || !query.data) return <JobDataState loading={query.isPending} error={query.error} onRetry={() => void query.refetch()} />;
  return <RecruiterJobDetail key={id} job={toRecruiterJobView(query.data)} />;
}
