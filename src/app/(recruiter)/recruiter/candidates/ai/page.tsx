import { Suspense } from 'react';
import { RecruiterAiResults } from '@/features/matching';

export default function RecruiterAiPage() {
  return <Suspense fallback={<div role="status" className="air-page-loading">Đang tải kết quả AI…</div>}><RecruiterAiResults /></Suspense>;
}
