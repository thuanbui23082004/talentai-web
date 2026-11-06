import { RecruiterCandidates } from '@/features/applications';
import { Suspense } from 'react';
export default function RecruiterCandidatesPage() { return <Suspense fallback={<p role="status">Đang tải ứng viên…</p>}><RecruiterCandidates /></Suspense>; }
