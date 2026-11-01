import type { RecruiterJob } from '@/features/jobs/types';
export function toRecruiterJobView(job: RecruiterJob) {
  const date = (value?: string) => value ? new Intl.DateTimeFormat('vi', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
  const money = (value?: number) => value === undefined ? '' : new Intl.NumberFormat('vi', { style: 'currency', currency: job.salary?.currency ?? 'VND', maximumFractionDigits: 0 }).format(value);
  return {
    id: job.id, title: job.title, company: job.company.name, initials: job.company.name.split(' ').slice(-2).map(word => word[0]).join(''),
    location: job.location.city, salary: job.salary?.negotiable || (job.salary?.min === undefined && job.salary?.max === undefined) ? 'negotiable' : [money(job.salary.min), money(job.salary.max)].filter(Boolean).join(' – '),
    experience: job.minExperienceYears ?? 0, hours: job.updatedAt ? Math.max(0, Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / 3600000)) : 0,
    applicants: job.stats?.applicationCount ?? 0, type: ({ full_time: 'fullTime', part_time: 'partTime', internship: 'internship', contract: 'contract', freelance: 'freelance', remote: 'remote', hybrid: 'hybrid' } as const)[job.workType], status: job.status,
    description: job.description.split('\n\n'), requirements: job.requirements.split('\n\n'), benefits: job.benefits?.split('\n\n') ?? [],
    createdDateLabel: date(job.createdAt), recruitmentPeriodLabel: job.applicationDeadline ? date(job.applicationDeadline) : '—', headcount: job.headcount ?? 1, viewCount: job.stats?.viewCount ?? 0,
  };
}
export type RecruiterJobView = ReturnType<typeof toRecruiterJobView>;
