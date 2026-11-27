import { Suspense } from 'react';
import { RecruiterAiResults } from '@/features/matching';

export const metadata = {
  title: 'Kết quả AI Matching | TalentAI Tuyển dụng',
  description: 'Bảng xếp hạng ứng viên và kết quả đối sánh AI chi tiết',
};

export default function RecruiterAiResultsPage() {
  return (
    <Suspense fallback={<div role="status" className="p-6 text-sm">Đang tải kết quả AI…</div>}>
      <RecruiterAiResults />
    </Suspense>
  );
}
