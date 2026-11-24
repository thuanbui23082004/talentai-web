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

const names = ['Mai An', 'Bảo Minh', 'Hà Linh', 'Gia Huy', 'Ngọc Anh', 'Thanh Sơn', 'Khánh Vy', 'Đức Phúc', 'Tuệ Nhi', 'Hải Nam', 'Minh Châu', 'Quang Vinh', 'Anh Thư', 'Nhật Hào', 'Hoài An', 'Phương Linh', 'Duy Khang', 'Kim Ngân', 'Trọng Tín', 'Ánh Dương', 'Xuân Mai', 'Hoàng Long', 'Lan Chi', 'Thiên Ân', 'Quốc Bảo', 'Bích Ngọc', 'Vân Anh'];
const recruiterStatuses = ['reviewing', 'submitted', 'interview', 'rejected', 'hired', 'withdrawn'] as const;
const skills = [['React', 'TypeScript'], ['Java', 'SQL'], ['Figma', 'UI/UX'], ['Giao tiếp', 'Bán hàng'], ['Docker', 'Linux'], ['Excel', 'Tuyển dụng']];
export const mockApplications: components['schemas']['RecruiterApplicationSummary'][] = names.map((name, index) => ({
  id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, '0')}`,
  jobId: mockJobs[index % mockJobs.length].id, jobTitle: mockJobs[index % mockJobs.length].title,
  candidate: { id: `00000000-0000-4000-a000-${String(index + 1).padStart(12, '0')}`, fullName: name,
    headline: mockJobs[index % mockJobs.length].title, city: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'][index % 3],
    totalYearsExperience: index % 7, educationLevel: index % 4 === 0 ? 'college' : 'bachelor', topSkills: skills[index % skills.length] },
  status: recruiterStatuses[index % recruiterStatuses.length], cvId: index === 26 ? undefined : `00000000-0000-4000-b000-${String(index + 1).padStart(12, '0')}`,
  appliedAt: `2026-10-${String(27 - index).padStart(2, '0')}T08:00:00Z`,
}));
