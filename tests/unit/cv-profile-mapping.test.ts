import { describe, expect, it } from "vitest";
import { mapProfileToCVData } from "@/features/cv/utils/map-profile-to-cv";
import type { PersonalProfile, CareerProfile } from "@/features/profile";

describe("CV từ hồ sơ ứng viên", () => {
    it("điền dữ liệu hiện có và bỏ trường trống an toàn", () => {
        const profile = { fullName: "Nguyễn A", email: "a@example.com", summary: null, phone: null } as PersonalProfile;
        const career = { education: [{ id: "1", school: "Đại học A", degree: null }], experience: [], certificates: [], skills: { skills: ["React"] } } as CareerProfile;
        expect(mapProfileToCVData(profile, career)).toMatchObject({ basics: { fullName: "Nguyễn A", email: "a@example.com", phone: "", summary: "" }, education: [{ school: "Đại học A", degree: "" }], skills: [{ name: "React", level: 80 }], projects: [], languages: [] });
    });
});
