import type { components } from '@/lib/api/generated/schema';
import type { RecruiterApplicationQuery } from '@/lib/api/application-schemas';
type Application = components['schemas']['RecruiterApplicationSummary'];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
export function selectRecruiterApplications(applications: Application[], query: RecruiterApplicationQuery, visibleJobIds: Set<string>) {
  const matches = applications.filter(item => {
    const candidate = item.candidate;
    const searchable = normalize([candidate.fullName, candidate.headline, item.jobTitle, ...(candidate.topSkills ?? [])].filter(Boolean).join(' '));
    return visibleJobIds.has(item.jobId)
      && (!query.q || searchable.includes(normalize(query.q)))
      && (!query.jobId || item.jobId === query.jobId)
      && (!query.status?.length || query.status.includes(item.status))
      && (!query.skills?.length || query.skills.every(skill => candidate.topSkills?.some(value => normalize(value) === normalize(skill))))
      && (query.minExperienceYears === undefined || (candidate.totalYearsExperience ?? 0) >= query.minExperienceYears)
      && (!query.educationLevel || candidate.educationLevel === query.educationLevel)
      && (!query.city || candidate.city === query.city)
      && (query.minMatchScore === undefined || (item.matchScore !== undefined && item.matchScore >= query.minMatchScore))
      && (!query.classification || item.evaluation?.classification === query.classification);
  });
  matches.sort((a, b) => {
    if (query.sort === 'applied_asc') return a.appliedAt.localeCompare(b.appliedAt) || a.id.localeCompare(b.id);
    if (query.sort === 'experience_desc') return (b.candidate.totalYearsExperience ?? 0) - (a.candidate.totalYearsExperience ?? 0) || b.appliedAt.localeCompare(a.appliedAt);
    if (query.sort === 'match_score_desc') return (b.matchScore ?? -1) - (a.matchScore ?? -1) || b.appliedAt.localeCompare(a.appliedAt);
    return b.appliedAt.localeCompare(a.appliedAt) || a.id.localeCompare(b.id);
  });
  return { items: matches.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), meta: { page: query.page, pageSize: query.pageSize, totalItems: matches.length, totalPages: Math.ceil(matches.length / query.pageSize) } };
}
