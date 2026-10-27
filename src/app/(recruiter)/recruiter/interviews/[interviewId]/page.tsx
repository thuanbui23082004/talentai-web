import { Suspense } from 'react';
import { InterviewDetailPage } from '@/features/interviews/components/interview-detail';
async function Detail({ params }: { params: Promise<{ interviewId: string }> }) {
  const { interviewId } = await params;
  return <InterviewDetailPage id={interviewId} />;
}
export default function Page({ params }: { params: Promise<{ interviewId: string }> }) {
  return <Suspense fallback={null}><Detail params={params} /></Suspense>;
}
