import { Suspense } from 'react';
import { JobDataState } from '@/features/jobs';
import { EditJobLoader } from '@/features/jobs';
async function Content({ params }: { params: Promise<{ jobId: string }> }) { return <EditJobLoader id={(await params).jobId} />; }
export default function EditRecruiterJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  return <Suspense fallback={<JobDataState loading />}><Content params={params} /></Suspense>;
}
