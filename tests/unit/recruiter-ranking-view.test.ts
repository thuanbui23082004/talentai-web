import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RecruiterAiResults } from '@/features/matching/components/recruiter/recruiter-ai-results';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams('jobId=job-1') }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@/features/jobs', () => ({ useRecruiterJobs: () => ({ data: { items: [{ id: 'job-1', title: 'Frontend Developer', company: { name: 'Công ty thử nghiệm' }, location: { city: 'Hà Nội' } }] } }) }));
vi.mock('@/features/matching/hooks/use-recruiter-results', () => ({
    recruiterMatchKeys: { all: ['recruiter-match-results'] },
    useMatchRankings: () => ({ data: { total: 1, items: [{ applicationId: 'application-1', rank: 1, score: 43.5 }] }, refetch: vi.fn() }),
    useRankedJobApplicants: () => ({ data: [{ id: 'application-1', fullName: 'Nguyễn Test', email: 'test@example.test', phone: '0901234567', applicantSnapshot: { yearsOfExperience: 2 } }], refetch: vi.fn() }),
    useApplicationMatch: () => ({ data: { status: 'SCORED', score: 43.5, details: {
        semantic_score: 40, skill_score: 50, matched_skills: ['React'], missing_skills: ['Zustand'], explanation: 'Nhận xét thật từ backend',
        field_scores: { roles: { score: 10, status: 'partial', reason: 'Vai trò gần phù hợp', evidence: 'Frontend trong CV', requirement: 'Phát triển giao diện', model: 'test' } },
    } } }),
}));

describe('recruiter ranking view', () => {
    it('fills the restored ranking and score layout with API data and shared criteria', () => {
        const html = renderToStaticMarkup(createElement(RecruiterAiResults));
        for (const value of ['air-job-card', 'air-ranking-card', 'air-detail-card', 'air-gauge-container', 'Nguyễn Test', 'test@example.test', '43,5%', 'React', 'Zustand', 'Nhận xét thật từ backend', 'Vai trò gần phù hợp', 'Frontend trong CV', 'Phát triển giao diện']) expect(html).toContain(value);
        expect(html).toContain('Chưa có nhận xét cho tiêu chí này.');
        expect(html).not.toContain('nguyenvanan@gmail.com');
    });
});
