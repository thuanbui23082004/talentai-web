import type { components } from "@/lib/api/generated/schema";

const statuses = ["reviewing", "submitted", "interview", "submitted", "interview", "hired", "rejected", "reviewing", "withdrawn", "submitted", "reviewing", "submitted"] as const;
export const createMockApplications = (jobs: components["schemas"]["JobSummary"][]): components["schemas"]["Application"][] => statuses.map((status, index) => {
    const job = jobs[index];
    const appliedAt = `2026-10-${String(10 + index).padStart(2, "0")}T02:00:00Z`;
    const updatedAt = `2026-10-${String(11 + index).padStart(2, "0")}T07:00:00Z`;
    return {
        id: `a0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        jobId: job.id, job, cvId: "c0000000-0000-4000-8000-000000000001", cvTitle: "CV ứng tuyển · Nguyễn Minh Anh",
        status, appliedAt, updatedAt, ...(status === "interview" ? { currentRound: "Vòng chuyên môn", interviewCount: 1 } : {}),
        statusHistory: [{ status: "submitted", changedBy: "candidate", changedAt: appliedAt }, ...(status !== "submitted" ? [{ status, changedBy: "recruiter" as const, changedAt: updatedAt }] : [])],
    };
});

export const createMockApplicationInterviews = (applications: components["schemas"]["Application"][]): components["schemas"]["Interview"][] => [2, 4].map((index, order) => ({
    id: `b0000000-0000-4000-8000-${String(order + 1).padStart(12, "0")}`,
    applicationId: applications[index].id, jobId: applications[index].jobId, jobTitle: applications[index].job.title, company: applications[index].job.company,
    round: "Vòng chuyên môn", startTime: `2026-10-${26 + order}T02:00:00Z`, endTime: `2026-10-${26 + order}T03:00:00Z`,
    mode: order === 0 ? "online" : "offline", ...(order === 0 ? {} : { location: "Văn phòng Mây Việt, Phường Phú Lợi, TP.HCM" }),
    invitationStatus: order === 0 ? "pending" : "accepted", status: "scheduled",
    message: "Bạn vui lòng chuẩn bị phần giới thiệu bản thân và các dự án đã thực hiện. Có mặt trước 10 phút để buổi trao đổi diễn ra thuận lợi.",
}));

import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';

const names = [
  'Nguyễn Văn An', 'Trần Minh Bình', 'Lê Thu Chi', 'Phạm Hoàng Duy', 'Vũ Thị Mai',
  'Đỗ Quang Huy', 'Bùi Khánh Linh', 'Hoàng Tuấn Kiệt', 'Trịnh Phương Thảo', 'Đặng Minh Khôi',
  'Lý Hải Yến', 'Dương Quốc Bảo', 'Hồ Thanh Tùng', 'Ngô Thùy Dung', 'Võ Đức Anh',
  'Phan Diệu Linh', 'Mai Trọng Hiếu', 'Đoàn Bảo Ngọc', 'Cao Thái Sơn', 'Lương Bích Hằng',
  'Trương Hoài Nam', 'Lâm Gia Hân', 'Tạ Minh Quân', 'Đinh Thảo My',
  'Ngọc Anh', 'Thanh Sơn', 'Khánh Vy', 'Đức Phúc', 'Tuệ Nhi', 'Hải Nam', 'Minh Châu', 'Quang Vinh', 'Anh Thư', 'Nhật Hào', 'Hoài An', 'Phương Linh', 'Duy Khang', 'Kim Ngân', 'Trọng Tín', 'Ánh Dương'
];
const recruiterStatuses = ['reviewing', 'submitted', 'interview', 'rejected', 'hired', 'withdrawn'] as const;
const skillsList = [
  ['Java', 'Spring Boot', 'SQL', 'REST API', 'Git', 'Docker'],
  ['Java', 'Spring Boot', 'SQL', 'Git', 'Docker'],
  ['Java', 'SQL', 'Git'],
  ['Java', 'Git'],
  ['SQL', 'Git'],
  ['React', 'TypeScript'],
  ['Docker', 'Linux'],
  ['Java', 'SQL']
];
export const mockApplications: components['schemas']['RecruiterApplicationSummary'][] = names.map((name, index) => {
  const isSeniorSoftware = index < 24;
  const targetJob = isSeniorSoftware ? mockJobs[0] : mockJobs[(index - 24) % (mockJobs.length - 1) + 1];
  const topSkills = index < skillsList.length ? skillsList[index] : skillsList[index % skillsList.length];
  return {
    id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, '0')}`,
    jobId: targetJob.id,
    jobTitle: targetJob.title,
    candidate: {
      id: `00000000-0000-4000-a000-${String(index + 1).padStart(12, '0')}`,
      fullName: name,
      headline: targetJob.title,
      city: isSeniorSoftware && index < 5 ? 'Hà Nội' : ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'][index % 3],
      totalYearsExperience: isSeniorSoftware ? (index === 0 ? 4 : index === 1 ? 4 : index < 3 ? 3 : 2) : index % 7,
      educationLevel: index % 4 === 0 ? 'college' : 'bachelor',
      topSkills
    },
    status: recruiterStatuses[index % recruiterStatuses.length],
    cvId: index === 26 ? undefined : `00000000-0000-4000-b000-${String(index + 1).padStart(12, '0')}`,
    appliedAt: `2026-10-${String(27 - (index % 25)).padStart(2, '0')}T08:00:00Z`,
  };
});
