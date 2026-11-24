import type { ViolationReport } from "./types";
export const REASON_LABELS: Record<ViolationReport["reason"], string> = { FRAUD: "Lừa đảo", SPAM: "Tin rác", FAKE_INFO: "Thông tin giả", SALARY_SCAM: "Lừa đảo về lương", INAPPROPRIATE_CONTENT: "Nội dung không phù hợp", OTHER: "Khác" };
export const STATUS_LABELS: Record<ViolationReport["status"], string> = { PENDING: "Chờ tiếp nhận", INVESTIGATING: "Đang xác minh", RESOLVED: "Đã xử lý", DISMISSED: "Đã đóng" };
