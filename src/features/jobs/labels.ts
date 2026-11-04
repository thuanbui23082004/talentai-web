import type { Job } from "./types";

export const EXPERIENCE_LABELS = { INTERN: "Thực tập sinh", FRESHER: "Mới tốt nghiệp", JUNIOR: "Junior", MIDDLE: "Middle", SENIOR: "Senior", EXPERT: "Chuyên gia" } as const;
export const WORK_MODE_LABELS = { ONSITE: "Tại văn phòng", HYBRID: "Kết hợp", REMOTE: "Từ xa" } as const;
export function experienceLabel(job: Pick<Job, "experienceLevel" | "minExperienceYears">) {
    if (job.experienceLevel) return EXPERIENCE_LABELS[job.experienceLevel];
    return job.minExperienceYears === undefined ? "Chưa cập nhật kinh nghiệm" : job.minExperienceYears ? `${job.minExperienceYears} năm` : "Không yêu cầu kinh nghiệm";
}

export const WORK_TYPE_LABELS: Record<Job["workType"], string> = { full_time: "Toàn thời gian", part_time: "Bán thời gian", internship: "Thực tập", contract: "Hợp đồng", freelance: "Tự do", remote: "Từ xa", hybrid: "Kết hợp" };
export const JOB_LEVEL_LABELS: Record<Job["level"], string> = { intern: "Thực tập sinh", fresher: "Mới tốt nghiệp", junior: "Nhân viên", middle: "Chuyên viên", senior: "Chuyên viên cao cấp", lead: "Trưởng nhóm", manager: "Quản lý", director: "Giám đốc" };
