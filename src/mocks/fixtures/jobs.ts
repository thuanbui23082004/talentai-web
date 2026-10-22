import type { components } from '@/lib/api/generated/schema';
import { recruiterPreviewJobs } from '@/mocks/fixtures/recruiter-preview';
import { recruiterCompany } from '@/mocks/fixtures/recruiter-company';
import { recruiterIndustries } from '@/mocks/fixtures/recruiter-catalog';
export const mockJobs: components['schemas']['RecruiterJob'][] = recruiterPreviewJobs.map((job, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 201).padStart(12, '0')}`,
  title: job.title, company: { id: recruiterCompany.id, name: job.company }, industry: recruiterIndustries[0],
  location: { city: job.location }, workType: job.type === 'partTime' ? 'part_time' : 'full_time', level: 'senior',
  status: job.status, description: job.description.join('\n\n'), requirements: job.requirements.join('\n\n'), benefits: job.benefits.join('\n\n'),
  minExperienceYears: job.experience, salary: job.salary === 'negotiable' ? { negotiable: true, currency: 'VND', period: 'month' } : { min: 10000000, max: 25000000, currency: 'VND', period: 'month', negotiable: false },
  headcount: job.headcount, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-21T00:00:00Z',
  applicationDeadline: '2026-12-31', stats: { viewCount: job.viewCount, applicationCount: job.applicants },
  hiringRounds: ['Sơ tuyển HR', 'Phỏng vấn chuyên môn', 'Phỏng vấn cuối'],
}));
