import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { RecruiterJobs } from '@/features/recruiter';
import { JobDataState } from '@/features/jobs';
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
async function JobsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (params.compose === '1') redirect('/recruiter/jobs/new');
  if (typeof params.job === 'string') {
    const legacy = /^preview-(\d+)$/.exec(params.job);
    const id = legacy ? '00000000-0000-4000-8000-' + String(200 + Number(legacy[1])).padStart(12, '0') : params.job;
    redirect('/recruiter/jobs/' + encodeURIComponent(id));
  }
  return <RecruiterJobs key={`${params.q ?? ''}:${params.location ?? ''}`} initialQuery={typeof params.q === 'string' ? params.q : ''} initialLocation={typeof params.location === 'string' ? params.location : ''} />;
}
export default function RecruiterJobsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<JobDataState loading />}><JobsContent searchParams={searchParams} /></Suspense>;
}