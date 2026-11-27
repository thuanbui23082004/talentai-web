import type { Notification } from "./types";

export const NOTIFICATION_LABELS: Record<Notification["type"], string> = {
    application_submitted: "Nộp hồ sơ thành công",
    application_status_changed: "Cập nhật trạng thái hồ sơ",
    application_withdrawn: "Ứng viên rút hồ sơ",
    interview_invited: "Lời mời phỏng vấn",
    interview_updated: "Dời lịch phỏng vấn",
    interview_cancelled: "Hủy lịch phỏng vấn",
    interview_response: "Phản hồi lời mời phỏng vấn",
    interview_result: "Kết quả phỏng vấn",
    job_recommended: "Gợi ý việc làm phù hợp",
    recruiter_new_application: "Có ứng viên ứng tuyển mới",
    company_verification: "Kết quả xác thực doanh nghiệp",
    job_moderated: "Duyệt tin tuyển dụng",
    payment_completed: "Thanh toán thành công",
    payment_failed: "Thanh toán thất bại",
    subscription_expiring: "Gói dịch vụ sắp hết hạn",
    auth_otp_requested: "Mã xác thực tài khoản",
    password_changed: "Đổi mật khẩu",
    account_locked: "Tài khoản bị khóa",
    report_update: "Cập nhật báo cáo",
    ai_task_completed: "Hoàn tất phân tích CV",
    system: "Thông báo hệ thống",
};

export function getNotificationLabel(type: Notification["type"], role: "candidate" | "recruiter") {
    if (type === "application_submitted" && role === "recruiter") return "Có ứng viên ứng tuyển mới";
    return NOTIFICATION_LABELS[type];
}
