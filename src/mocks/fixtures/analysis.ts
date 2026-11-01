import type { components } from '@/lib/api/generated/schema';
export const mockAnalysis = [];
export function syntheticMatching(application: components['schemas']['RecruiterApplicationDetail'], job: components['schemas']['RecruiterJob'], id: string, now: string): components['schemas']['MatchingResult'] {
  const requirements = job.requiredSkills?.length ? job.requiredSkills : (job.skills?.length ? job.skills : ['React', 'TypeScript', 'SQL']).map(name => ({ name, required: true }));
  const candidateSkills = application.candidate.topSkills ?? [];
  const matched = requirements.filter(skill => candidateSkills.some(value => value.toLocaleLowerCase('vi') === skill.name.toLocaleLowerCase('vi')));
  const missing = requirements.filter(skill => !matched.includes(skill));
  const skills = Math.round(100 * matched.length / Math.max(1, requirements.length));
  const experience = Math.min(100, Math.round(100 * (application.candidate.totalYearsExperience ?? 0) / Math.max(1, job.minExperienceYears ?? 1)));
  const education = !job.educationLevel || application.candidate.educationLevel === job.educationLevel ? 100 : 50;
  return { id, cvId: application.cvId!, jobId: job.id, jobTitle: job.title, score: Math.round(skills * 0.6 + experience * 0.3 + education * 0.1), breakdown: { skills, experience, education },
    matchedSkills: matched.map(skill => ({ name: skill.name })), missingSkills: missing.map(skill => ({ name: skill.name, importance: skill.required ? 'must_have' : 'nice_to_have' })),
    explanation: `Hồ sơ có ${matched.length}/${requirements.length} kỹ năng được yêu cầu. Mức độ phù hợp kinh nghiệm là ${experience}%. Cần trao đổi thêm về các kỹ năng còn thiếu và phạm vi công việc.`,
    disclaimer: 'Kết quả chỉ mang tính tham khảo. Nhà tuyển dụng là người quyết định.', createdAt: now };
}
