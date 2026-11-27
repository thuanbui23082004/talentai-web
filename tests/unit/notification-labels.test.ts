import { describe, expect, it } from "vitest";
import { getNotificationLabel, NOTIFICATION_LABELS } from "@/features/notifications/labels";

describe("notification type labels", () => {
    it("uses the requested event labels for candidates", () => {
        expect(NOTIFICATION_LABELS.application_submitted).toBe("Nộp hồ sơ thành công");
        expect(NOTIFICATION_LABELS.application_status_changed).toBe("Cập nhật trạng thái hồ sơ");
        expect(NOTIFICATION_LABELS.interview_invited).toBe("Lời mời phỏng vấn");
        expect(NOTIFICATION_LABELS.interview_updated).toBe("Dời lịch phỏng vấn");
        expect(NOTIFICATION_LABELS.interview_cancelled).toBe("Hủy lịch phỏng vấn");
        expect(NOTIFICATION_LABELS.interview_result).toBe("Kết quả phỏng vấn");
        expect(NOTIFICATION_LABELS.job_recommended).toBe("Gợi ý việc làm phù hợp");
    });

    it("shows the recruiter meaning for application_submitted", () => {
        expect(getNotificationLabel("application_submitted", "candidate")).toBe("Nộp hồ sơ thành công");
        expect(getNotificationLabel("application_submitted", "recruiter")).toBe("Có ứng viên ứng tuyển mới");
        expect(getNotificationLabel("recruiter_new_application", "recruiter")).toBe("Có ứng viên ứng tuyển mới");
    });
});
