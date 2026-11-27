'use client';

import { CheckCheck, ChevronDown, CircleHelp, ListPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplicationMatch } from '../../hooks/use-recruiter-results';
import './application-match-panel.css';

function MatchingSkills({ title, skills, positive = false }: { title: string; skills: string[]; positive?: boolean }) {
    const Icon = positive ? CheckCheck : ListPlus;
    return <section className={`application-match-skills ${positive ? 'application-match-skills-positive' : ''}`}>
        <header>
            <Icon size={15} aria-hidden="true" />
            <h3>{title}</h3>
            <span className="application-match-count">{skills.length}</span>
        </header>
        {skills.length ? <ul>{skills.map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}</ul> : <p className="application-match-empty">Chưa ghi nhận kỹ năng.</p>}
    </section>;
}

export function ApplicationMatchPanel({ applicationId }: { applicationId: string }) {
    const match = useApplicationMatch(applicationId);
    const result = match.data;
    const details = result?.details;
    const score = result?.score;

    return <section className="candidate-detail-panel application-match-panel" aria-label="Gợi ý từ AI">
        <header className="application-match-heading">
            <span><Sparkles size={17} aria-hidden="true" /></span>
            <h2>Gợi ý từ AI</h2>
        </header>
        {match.isPending ? <div className="space-y-4" role="status" aria-label="Đang tải kết quả đối sánh">
            <Skeleton className="h-30 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" />
        </div> : match.isError ? <div className="application-match-state" role="alert">
            <p>Không tải được kết quả AI.</p>
            <Button variant="outline" onClick={() => void match.refetch()}>Thử lại</Button>
        </div> : result?.status !== 'SCORED' || score == null || !details ? <p className="application-match-empty">Chưa có kết quả đối sánh cho hồ sơ này.</p> : <div className="application-match-content">
            <div className="application-match-score">
                <div className="application-match-ring" style={{ background: `conic-gradient(var(--primary) ${score}%, var(--secondary) ${score}% 100%)` }}>
                    <div><strong>{new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(score)}%</strong></div>
                </div>
                <p className="application-match-score-label">Mức độ<br />phù hợp<small>Đối sánh CV với JD</small></p>
            </div>

            <MatchingSkills title="Kỹ năng phù hợp" skills={details.matched_skills} positive />
            <MatchingSkills title="Cần bổ sung" skills={details.missing_skills} />

            <details className="application-match-explanation">
                <summary>Nhận xét của AI<ChevronDown size={15} aria-hidden="true" /></summary>
                <p>{details.explanation || 'Chưa có giải thích từ AI.'}</p>
            </details>
            <p className="application-match-footer"><CircleHelp size={13} aria-hidden="true" /><span>Kết quả chỉ để tham khảo. Nhà tuyển dụng quyết định sau khi xem đầy đủ hồ sơ.</span></p>
        </div>}
    </section>;
}
