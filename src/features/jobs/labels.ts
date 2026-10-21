import type { Job } from "./types";

export const WORK_TYPE_LABELS: Record<Job["workType"], string> = { full_time: "Toàn thời gian", part_time: "Bán thời gian", internship: "Thực tập", contract: "Hợp đồng", freelance: "Tự do", remote: "Từ xa", hybrid: "Kết hợp" };
export const JOB_LEVEL_LABELS: Record<Job["level"], string> = { intern: "Thực tập sinh", fresher: "Mới tốt nghiệp", junior: "Nhân viên", middle: "Chuyên viên", senior: "Chuyên viên cao cấp", lead: "Trưởng nhóm", manager: "Quản lý", director: "Giám đốc" };
