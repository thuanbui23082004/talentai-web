import type { components } from '@/lib/api/generated/schema';
import { mockJobs } from '@/mocks/fixtures/jobs';

const names = ['Mai An', 'Bảo Minh', 'Hà Linh', 'Gia Huy', 'Ngọc Anh', 'Thanh Sơn', 'Khánh Vy', 'Đức Phúc', 'Tuệ Nhi', 'Hải Nam', 'Minh Châu', 'Quang Vinh', 'Anh Thư', 'Nhật Hào', 'Hoài An', 'Phương Linh', 'Duy Khang', 'Kim Ngân', 'Trọng Tín', 'Ánh Dương', 'Xuân Mai', 'Hoàng Long', 'Lan Chi', 'Thiên Ân', 'Quốc Bảo', 'Bích Ngọc', 'Vân Anh'];
const statuses = ['reviewing', 'submitted', 'interview', 'rejected', 'hired', 'withdrawn'] as const;
const skills = [['React', 'TypeScript'], ['Java', 'SQL'], ['Figma', 'UI/UX'], ['Giao tiếp', 'Bán hàng'], ['Docker', 'Linux'], ['Excel', 'Tuyển dụng']];
export const mockApplications: components['schemas']['RecruiterApplicationSummary'][] = names.map((name, index) => ({
  id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, '0')}`,
  jobId: mockJobs[index % mockJobs.length].id, jobTitle: mockJobs[index % mockJobs.length].title,
  candidate: { id: `00000000-0000-4000-a000-${String(index + 1).padStart(12, '0')}`, fullName: name,
    headline: mockJobs[index % mockJobs.length].title, city: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'][index % 3],
    totalYearsExperience: index % 7, educationLevel: index % 4 === 0 ? 'college' : 'bachelor', topSkills: skills[index % skills.length] },
  status: statuses[index % statuses.length], cvId: index === 26 ? undefined : `00000000-0000-4000-b000-${String(index + 1).padStart(12, '0')}`,
  appliedAt: `2026-10-${String(27 - index).padStart(2, '0')}T08:00:00Z`,
}));
