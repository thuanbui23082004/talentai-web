import type { components } from '@/lib/api/generated/schema';
import { mockApplications } from '@/mocks/fixtures/applications';

const id = (index: number, group: string) => `00000000-0000-4000-${group.replace(/^c/, '8')}-${String(index + 1).padStart(12, '0')}`;
export const mockCandidateDetails: components['schemas']['RecruiterApplicationDetail'][] = mockApplications.map((application, index) => ({
  ...application,
  currentRound: application.status === 'reviewing' ? 'Sơ tuyển HR' : application.status === 'interview' ? 'Phỏng vấn chuyên môn' : undefined,
  matchScore: application.cvId && index % 3 !== 2 ? 78 : undefined,
  profile: { userId: application.candidate.id, fullName: application.candidate.fullName, email: `candidate-${index + 1}@example.test`,
    phone: '+84000000000', headline: application.candidate.headline, city: application.candidate.city,
    address: application.candidate.city, dateOfBirth: '1998-05-14', gender: 'other',
    summary: 'Chuyên viên có kinh nghiệm phát triển sản phẩm, phối hợp với các bộ phận và cải tiến quy trình làm việc. Chủ động học hỏi, chú trọng chất lượng và kết quả công việc.',
    totalYearsExperience: application.candidate.totalYearsExperience, completenessPercent: 85,
    links: [{ label: 'Portfolio', url: 'https://example.test/portfolio' }, { label: 'GitHub', url: 'https://example.test/projects' }],
    experiences: [{ id: id(index, 'c000'), company: 'Công ty Công nghệ Bình Minh', position: application.candidate.headline ?? 'Chuyên viên', startDate: '2022-01-01', isCurrent: true, description: 'Phát triển các tính năng sản phẩm; phối hợp cùng đội ngũ thiết kế và kiểm thử để đảm bảo chất lượng. Chủ động đề xuất cải tiến và chia sẻ kiến thức trong nhóm.' },
      { id: id(index, 'c001'), company: 'Công ty Sáng tạo Cánh Diều', position: 'Chuyên viên dự án', startDate: '2020-06-01', endDate: '2021-12-31', isCurrent: false, description: 'Tham gia triển khai dự án, theo dõi tiến độ và hỗ trợ xử lý các vấn đề phát sinh trong quá trình vận hành.' }],
    educations: [{ id: id(index, 'c002'), school: 'Trường Đại học Công nghệ Sao Mai', degree: 'bachelor', major: 'Công nghệ và Quản lý', startDate: '2016-09-01', endDate: '2020-06-01', isCurrent: false }],
    skills: (application.candidate.topSkills ?? []).map((name, skillIndex) => ({ id: id(index * 10 + skillIndex, 'c003'), name, level: 'advanced', yearsOfExperience: 3 })),
    certificates: [{ id: id(index, 'c004'), name: 'Chứng nhận chuyên môn phát triển sản phẩm', issuer: 'Học viện Công nghệ Sao Mai', issuedDate: '2023-06-01' }],
  },
  cvAvailable: !!application.cvId,
  cv: application.cvId ? { id: application.cvId, title: 'Hồ sơ CV', source: 'manual', isDefault: true, versionCount: 1, createdAt: application.appliedAt, updatedAt: application.appliedAt, content: { languages: [{ name: 'Tiếng Việt', level: 'Bản ngữ' }, { name: 'Tiếng Anh', level: 'Khá' }] } } : undefined,
  matching: application.cvId && index % 3 !== 2 ? { id: id(index, 'c005'), cvId: application.cvId, jobId: application.jobId, score: 78, explanation: 'Hồ sơ đáp ứng phần lớn kỹ năng yêu cầu; kinh nghiệm triển khai sản phẩm phù hợp. Nhà tuyển dụng cần trao đổi thêm về phạm vi trách nhiệm và mục tiêu nghề nghiệp.', breakdown: { skills: 80, experience: 75, education: 85 }, createdAt: application.appliedAt } : undefined,
  interviews: [], statusHistory: [{ status: application.status, changedBy: 'recruiter', changedAt: application.appliedAt }],
}));
