import type { CandidateTrackingStatus } from "./services/candidate-tracking";

export const trackingStatusLabels: Record<CandidateTrackingStatus, string> = {
    submitted: "Đã nộp hồ sơ",
    reviewing: "Đang xem xét",
    shortlisted: "Đã vào danh sách chọn",
    interview_scheduled: "Đã lên lịch phỏng vấn",
    offered: "Có đề nghị tuyển dụng",
    hired: "Đã tuyển dụng",
    rejected: "Chưa phù hợp",
    withdrawn: "Đã rút hồ sơ",
};

export const trackingStages = [
    "submitted", "reviewing", "shortlisted", "interview_scheduled", "offered", "hired",
] as const satisfies readonly CandidateTrackingStatus[];

export const trackingStatusDescriptions: Record<CandidateTrackingStatus, string> = {
    submitted: "Hồ sơ ứng tuyển đã được hệ thống ghi nhận.",
    reviewing: "Hồ sơ đang ở giai đoạn xem xét.",
    shortlisted: "Hồ sơ đã được đưa vào danh sách chọn.",
    interview_scheduled: "Lịch phỏng vấn đã được ghi nhận cho hồ sơ này.",
    offered: "Hồ sơ đã chuyển sang giai đoạn đề nghị tuyển dụng.",
    hired: "Hồ sơ đã được cập nhật sang trạng thái tuyển dụng thành công.",
    rejected: "Hồ sơ đã kết thúc với trạng thái chưa phù hợp.",
    withdrawn: "Hồ sơ đã được rút khỏi đợt tuyển dụng này.",
};
