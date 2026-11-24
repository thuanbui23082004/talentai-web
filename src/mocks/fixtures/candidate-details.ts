import type { components } from '@/lib/api/generated/schema';
import { mockApplications } from '@/mocks/fixtures/applications';

const id = (index: number, group: string) => `00000000-0000-4000-${group.replace(/^c/, '8')}-${String(index + 1).padStart(12, '0')}`;

const seniorSoftwareScores = [92, 85, 78, 68, 65, 62, 60, 58, 56, 55, 52, 50, 48, 45, 42, 40, 38, 35];

export const mockCandidateDetails: components['schemas']['RecruiterApplicationDetail'][] = mockApplications.map((application, index) => {
  const isSeniorSoftware = index < 24;
  let score: number | undefined = undefined;
  if (isSeniorSoftware) {
    if (index < 18) {
      score = seniorSoftwareScores[index];
    }
  } else if (application.cvId && index % 3 !== 2) {
    score = 78;
  }

  const email = index === 0 ? 'nguyenvanan@gmail.com' : index === 1 ? 'tranminhbinh@gmail.com' : index === 2 ? 'lethuchi@gmail.com' : index === 3 ? 'phamhoangduy@gmail.com' : index === 4 ? 'vuthimai@gmail.com' : `candidate-${index + 1}@example.test`;
  const phone = index === 0 ? '0987 654 321' : index === 1 ? '0987 123 456' : index === 2 ? '0987 234 567' : index === 3 ? '0987 345 678' : index === 4 ? '0987 456 789' : '+84000000000';

  let matching: components['schemas']['MatchingResult'] | undefined = undefined;
  if (score !== undefined && application.cvId) {
    if (index === 0) {
      matching = {
        id: id(index, 'c005'),
        cvId: application.cvId,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        score: 92,
        breakdown: { skills: 88, experience: 94, education: 90 },
        matchedSkills: [
          { name: 'Java' },
          { name: 'Spring Boot' },
          { name: 'SQL' },
          { name: 'REST API' },
          { name: 'Git' },
          { name: 'Docker' }
        ],
        missingSkills: [
          { name: 'Kubernetes', importance: 'must_have' }
        ],
        explanation: 'Ứng viên có mức độ phù hợp rất cao với vị trí Senior Software. CV thể hiện 4 năm kinh nghiệm phát triển backend với Java, Spring Boot, SQL và Docker. Kỹ năng và kinh nghiệm đáp ứng tốt hầu hết yêu cầu của JD. Nên cân nhắc phỏng vấn sớm.',
        disclaimer: 'Kết quả do AI gợi ý, chỉ mang tính tham khảo.',
        createdAt: application.appliedAt
      };
    } else if (index === 1) {
      matching = {
        id: id(index, 'c005'),
        cvId: application.cvId,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        score: 85,
        breakdown: { skills: 82, experience: 88, education: 90 },
        matchedSkills: [
          { name: 'Java' },
          { name: 'Spring Boot' },
          { name: 'SQL' },
          { name: 'Git' },
          { name: 'Docker' }
        ],
        missingSkills: [
          { name: 'REST API', importance: 'must_have' },
          { name: 'Kubernetes', importance: 'must_have' }
        ],
        explanation: 'Ứng viên có kiến thức vững về Java và Spring Boot, khả năng xử lý cơ sở dữ liệu tốt. Cần bổ sung kinh nghiệm về microservices và cloud container.',
        disclaimer: 'Kết quả do AI gợi ý, chỉ mang tính tham khảo.',
        createdAt: application.appliedAt
      };
    } else if (index === 2) {
      matching = {
        id: id(index, 'c005'),
        cvId: application.cvId,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        score: 78,
        breakdown: { skills: 75, experience: 80, education: 85 },
        matchedSkills: [
          { name: 'Java' },
          { name: 'SQL' },
          { name: 'Git' }
        ],
        missingSkills: [
          { name: 'Spring Boot', importance: 'must_have' },
          { name: 'Docker', importance: 'must_have' }
        ],
        explanation: 'Ứng viên có nền tảng lập trình tốt, tư duy logic nhanh nhạy. Cần thêm kinh nghiệm thực chiến với framework backend chính.',
        disclaimer: 'Kết quả do AI gợi ý, chỉ mang tính tham khảo.',
        createdAt: application.appliedAt
      };
    } else if (index === 3) {
      matching = {
        id: id(index, 'c005'),
        cvId: application.cvId,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        score: 68,
        breakdown: { skills: 65, experience: 70, education: 75 },
        matchedSkills: [
          { name: 'Java' },
          { name: 'Git' }
        ],
        missingSkills: [
          { name: 'Spring Boot', importance: 'must_have' },
          { name: 'SQL', importance: 'must_have' },
          { name: 'Docker', importance: 'must_have' }
        ],
        explanation: 'Ứng viên đáp ứng mức độ cơ bản các yêu cầu vị trí. Cần đào tạo thêm về quy trình phát triển và các công nghệ chuyên sâu.',
        disclaimer: 'Kết quả do AI gợi ý, chỉ mang tính tham khảo.',
        createdAt: application.appliedAt
      };
    } else if (index === 4) {
      matching = {
        id: id(index, 'c005'),
        cvId: application.cvId,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        score: 65,
        breakdown: { skills: 60, experience: 68, education: 70 },
        matchedSkills: [
          { name: 'SQL' },
          { name: 'Git' }
        ],
        missingSkills: [
          { name: 'Java', importance: 'must_have' },
          { name: 'Spring Boot', importance: 'must_have' }
        ],
        explanation: 'Ứng viên có tiềm năng phát triển nhưng chưa có nhiều kinh nghiệm trực tiếp với stack công nghệ chính của vị trí.',
        disclaimer: 'Kết quả do AI gợi ý, chỉ mang tính tham khảo.',
        createdAt: application.appliedAt
      };
    } else {
      matching = {
        id: id(index, 'c005'),
        cvId: application.cvId,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        score,
        breakdown: { skills: Math.max(40, score - 5), experience: Math.min(95, score + 4), education: 85 },
        matchedSkills: [{ name: 'SQL' }, { name: 'Git' }],
        missingSkills: [{ name: 'Kubernetes', importance: 'must_have' }],
        explanation: `Hồ sơ đạt điểm phù hợp ${score}%. Đã đáp ứng một phần các yêu cầu chuyên môn.`,
        disclaimer: 'Kết quả do AI gợi ý, chỉ mang tính tham khảo.',
        createdAt: application.appliedAt
      };
    }
  }

  return {
    ...application,
    currentRound: application.status === 'reviewing' ? 'Sơ tuyển HR' : application.status === 'interview' ? 'Phỏng vấn chuyên môn' : undefined,
    matchScore: score,
    profile: {
      userId: application.candidate.id,
      fullName: application.candidate.fullName,
      email,
      phone,
      headline: application.candidate.headline,
      city: application.candidate.city,
      address: application.candidate.city,
      dateOfBirth: '1998-05-14',
      gender: index % 2 === 0 ? 'male' : 'female',
      summary: 'Chuyên viên có kinh nghiệm phát triển sản phẩm, phối hợp với các bộ phận và cải tiến quy trình làm việc. Chủ động học hỏi, chú trọng chất lượng và kết quả công việc.',
      totalYearsExperience: application.candidate.totalYearsExperience,
      completenessPercent: 85,
      links: [{ label: 'Portfolio', url: 'https://example.test/portfolio' }, { label: 'GitHub', url: 'https://example.test/projects' }],
      experiences: [
        { id: id(index, 'c000'), company: 'Công ty Công nghệ Bình Minh', position: application.candidate.headline ?? 'Chuyên viên', startDate: '2022-01-01', isCurrent: true, description: 'Phát triển các tính năng sản phẩm; phối hợp cùng đội ngũ thiết kế và kiểm thử để đảm bảo chất lượng. Chủ động đề xuất cải tiến và chia sẻ kiến thức trong nhóm.' },
        { id: id(index, 'c001'), company: 'Công ty Sáng tạo Cánh Diều', position: 'Chuyên viên dự án', startDate: '2020-06-01', endDate: '2021-12-31', isCurrent: false, description: 'Tham gia triển khai dự án, theo dõi tiến độ và hỗ trợ xử lý các vấn đề phát sinh trong quá trình vận hành.' }
      ],
      educations: [{ id: id(index, 'c002'), school: 'Trường Đại học Bách Khoa', degree: 'bachelor', major: 'Công nghệ Thông tin', startDate: '2016-09-01', endDate: '2020-06-01', isCurrent: false }],
      skills: (application.candidate.topSkills ?? []).map((name, skillIndex) => ({ id: id(index * 10 + skillIndex, 'c003'), name, level: 'advanced', yearsOfExperience: 3 })),
      certificates: [{ id: id(index, 'c004'), name: 'Chứng nhận chuyên môn phát triển phần mềm', issuer: 'Học viện Công nghệ', issuedDate: '2023-06-01' }],
    },
    cvAvailable: !!application.cvId,
    cv: application.cvId ? { id: application.cvId, title: 'Hồ sơ CV', source: 'manual', isDefault: true, versionCount: 1, createdAt: application.appliedAt, updatedAt: application.appliedAt, content: { languages: [{ name: 'Tiếng Việt', level: 'Bản ngữ' }, { name: 'Tiếng Anh', level: 'Khá' }] } } : undefined,
    matching,
    interviews: [],
    statusHistory: [{ status: application.status, changedBy: 'recruiter', changedAt: application.appliedAt }],
  };
});
