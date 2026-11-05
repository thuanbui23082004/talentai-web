import type { components } from '@/lib/api/generated/schema';

type Posting = components['schemas']['JobPostingRecord'];
type Company = { id: string; name: string };

// Retain the complete Java record for editing; adapt only the existing card/detail model.
export function mapRecruiterPosting(posting: Posting, company: Company): components['schemas']['RecruiterJob'] {
  const status = { DRAFT: 'draft', ACTIVE: 'open', PAUSED: 'paused', CLOSED: 'closed', EXPIRED: 'closed' } as const;
  return {
    id: posting.jobPostId, company, posting, title: posting.title ?? '',
    description: posting.description ?? '', requirements: posting.requirements ?? '', benefits: posting.benefits,
    location: { city: posting.location || 'Chưa cập nhật địa điểm' },
    salary: posting.salaryCurrency ? { currency: posting.salaryCurrency, min: posting.salaryMin, max: posting.salaryMax, negotiable: posting.isSalaryNegotiable ?? false } : undefined,
    level: posting.experienceLevel === 'EXPERT' ? 'senior' : posting.experienceLevel?.toLowerCase() as components['schemas']['JobLevel'] ?? 'junior',
    workType: posting.jobType?.toLowerCase() as components['schemas']['WorkType'] ?? 'full_time',
    status: status[posting.status], headcount: posting.headCount, applicationDeadline: posting.deadline,
    createdAt: posting.createdAt, updatedAt: posting.updatedAt,
  };
}
