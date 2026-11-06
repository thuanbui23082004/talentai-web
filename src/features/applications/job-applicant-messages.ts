import type { components } from "@/lib/api/generated/schema";

export const JOB_APPLICANT_STATUS_LABELS: Record<
    components["schemas"]["JobApplicantStatus"],
    string
> = {
    submitted: "Đã nộp",
    reviewing: "Đang xem xét",
    shortlisted: "Ứng viên phù hợp",
    interview_scheduled: "Đã lên lịch phỏng vấn",
    offered: "Đã gửi đề nghị",
    rejected: "Đã từ chối",
    withdrawn: "Đã rút hồ sơ",
    hired: "Đã tuyển dụng",
};
export const JOB_EMPLOYMENT_LABELS: Record<string, string> = {
    INTERN: "Thực tập",
    INTERNSHIP: "Thực tập",
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    CONTRACT: "Hợp đồng",
    FREELANCE: "Tự do",
    internship: "Thực tập",
    full_time: "Toàn thời gian",
    part_time: "Bán thời gian",
    contract: "Hợp đồng",
    freelance: "Tự do",
};
