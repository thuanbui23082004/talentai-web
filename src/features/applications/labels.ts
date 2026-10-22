import type { Application } from "./types";

export const APPLICATION_LABELS: Record<Application["status"], string> = {
    submitted: "Đã nộp hồ sơ", reviewing: "Đang xem xét", interview: "Phỏng vấn",
    hired: "Đã trúng tuyển", rejected: "Chưa phù hợp", withdrawn: "Đã rút hồ sơ",
};
export const APPLICATION_TONES: Record<Application["status"], string> = {
    submitted: "bg-secondary text-primary", reviewing: "bg-info-soft text-info-foreground",
    interview: "bg-warning-soft text-warning-foreground", hired: "bg-success-soft text-success-foreground",
    rejected: "bg-muted text-muted-foreground", withdrawn: "bg-muted text-muted-foreground",
};
