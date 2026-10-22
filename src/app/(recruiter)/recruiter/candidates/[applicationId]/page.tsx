import { Suspense } from 'react';
import { CandidateDetailPage } from '@/features/applications';
async function CandidateContent({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <CandidateDetailPage id={applicationId} />;
}
export default function RecruiterCandidateDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  return <Suspense fallback={<div className="recruiter-route-skeleton" aria-busy="true"><div /><div /><div /></div>}><CandidateContent params={params} /></Suspense>;
}
