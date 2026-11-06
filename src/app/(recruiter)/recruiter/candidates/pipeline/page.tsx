import { RecruiterPipeline } from '@/features/applications';
import { Suspense } from 'react';

export default function RecruiterPipelinePage() { return <Suspense fallback={<p>Đang tải bảng theo dõi…</p>}><RecruiterPipeline /></Suspense>; }
