import type { Application } from "./types";

export const APPLICATION_LABELS: Record<Application["status"], string> = {
    submitted: "Đã nộp hồ sơ", reviewing: "Đang xem xét", interview: "Phỏng vấn",
    hired: "Đã trúng tuyển", rejected: "Chưa phù hợp", withdrawn: "Đã rút hồ sơ",
};
export const APPLICATION_TONES: Record<Application["status"], string> = {
    submitted: "bg-primary text-white", reviewing: "bg-info-foreground text-white",
    interview: "bg-warning-foreground text-white", hired: "bg-success-foreground text-white",
    rejected: "bg-destructive text-white", withdrawn: "bg-muted-foreground text-white",
};

export const APPLICATION_PANEL_TONES: Record<Application["status"], string> = {
    submitted: "border-primary/25 border-l-primary bg-primary/7",
    reviewing: "border-info/30 border-l-info bg-info/9",
    interview: "border-warning/30 border-l-warning bg-warning/10",
    hired: "border-success/25 border-l-success bg-success/9",
    rejected: "border-destructive/25 border-l-destructive bg-destructive/7",
    withdrawn: "border-muted-foreground/25 border-l-muted-foreground bg-muted-foreground/8",
};

export const APPLICATION_PROGRESS_TONES: Record<Application["status"], string> = {
    submitted: "bg-primary", reviewing: "bg-info", interview: "bg-warning",
    hired: "bg-success", rejected: "bg-destructive", withdrawn: "bg-muted-foreground",
};
