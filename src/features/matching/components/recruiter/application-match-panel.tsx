'use client';

import { Button } from '@/components/ui/button';
import { useApplicationMatch } from '../../hooks/use-recruiter-results';

export function ApplicationMatchPanel({ applicationId }: { applicationId: string }) {
  const match = useApplicationMatch(applicationId);

  return (
    <section className="candidate-detail-panel job-applicant-side-panel" aria-label="Gợi ý từ AI">
      <h2>Gợi ý từ AI</h2>
      {match.isPending ? (
        <p role="status">Đang tải kết quả đối sánh…</p>
      ) : match.isError ? (
        <div role="alert">
          <p>Không tải được kết quả AI.</p>
          <Button variant="outline" onClick={() => void match.refetch()}>Thử lại</Button>
        </div>
      ) : match.data.status === 'NOT_SCORED' || match.data.score === null || !match.data.details ? (
        <p>Chưa có kết quả đối sánh cho hồ sơ này.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <p><strong className="text-xl text-primary">{Math.round(match.data.score)}%</strong> phù hợp</p>
          <p>{match.data.details.explanation || 'Chưa có giải thích từ AI.'}</p>
          <div>
            <strong>Kỹ năng phù hợp</strong>
            <p>{match.data.details.matched_skills.length ? match.data.details.matched_skills.join(', ') : 'Chưa ghi nhận'}</p>
          </div>
          <div>
            <strong>Kỹ năng cần bổ sung</strong>
            <p>{match.data.details.missing_skills.length ? match.data.details.missing_skills.join(', ') : 'Chưa ghi nhận'}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Điểm AI chỉ để tham khảo. Nhà tuyển dụng quyết định sau khi xem đầy đủ hồ sơ.
          </p>
        </div>
      )}
    </section>
  );
}
