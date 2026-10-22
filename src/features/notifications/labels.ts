import type { Notification } from "./types";

export const NOTIFICATION_LABELS: Record<Notification["type"], string> = {
    application_submitted: "Ứng tuyển", application_status_changed: "Ứng tuyển", application_withdrawn: "Ứng tuyển",
    interview_invited: "Phỏng vấn", interview_updated: "Phỏng vấn", interview_cancelled: "Phỏng vấn", interview_response: "Phỏng vấn", interview_result: "Phỏng vấn",
    job_recommended: "Việc làm", job_moderated: "Việc làm", company_verification: "Doanh nghiệp", account_locked: "Tài khoản", report_update: "Báo cáo", ai_task_completed: "Phân tích CV", system: "Hệ thống",
};
