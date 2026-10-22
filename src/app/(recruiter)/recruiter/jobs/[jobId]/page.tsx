import { Suspense } from 'react';
import { JobDetailLoader, JobDataState } from '@/features/jobs';
async function DetailContent({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const legacy = /^preview-(\d+)$/.exec(jobId);
  const id = legacy ? '00000000-0000-4000-8000-' + String(200 + Number(legacy[1])).padStart(12, '0') : jobId;
  return <JobDetailLoader id={id} />;
}
export default function RecruiterJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  return <Suspense fallback={<JobDataState loading />}><DetailContent params={params} /></Suspense>;
}