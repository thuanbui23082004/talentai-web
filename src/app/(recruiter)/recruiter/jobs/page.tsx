import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { RecruiterJobs } from '@/features/recruiter';
import { JobDataState } from '@/features/jobs';
import { recruiterJobFiltersSchema } from '@/lib/jobs/recruiter-filters';
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
async function JobsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (params.compose === '1') redirect('/recruiter/jobs/new');
  if (typeof params.job === 'string') {
    const legacy = /^preview-(\d+)$/.exec(params.job);
    const id = legacy ? '00000000-0000-4000-8000-' + String(200 + Number(legacy[1])).padStart(12, '0') : params.job;
    redirect('/recruiter/jobs/' + encodeURIComponent(id));
  }
  const filters = recruiterJobFiltersSchema.safeParse({ status: params.status, page: params.page });
  return <RecruiterJobs status={filters.success ? filters.data.status : undefined} page={filters.success ? filters.data.page : 1} />;
}
export default function RecruiterJobsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<JobDataState loading />}><JobsContent searchParams={searchParams} /></Suspense>;
}
