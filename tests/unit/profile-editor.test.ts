import { describe, expect, it } from "vitest";
import { emptyProfileDraft, profileEditorSchema } from "@/features/profile/schemas/profile-editor";
import { formatMonthYear } from "@/lib/utils";

describe("profile editor draft validation", () => {
    const experience = { ...emptyProfileDraft("experience"), company: "Sao Việt", position: "Frontend Developer", startDate: "2022-01", endDate: "2024-06" };
    it("requires company, position and a valid employment period", () => {
        expect(profileEditorSchema.safeParse(emptyProfileDraft("experience")).success).toBe(false);
        expect(profileEditorSchema.safeParse(experience).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...experience, startDate: "2024-13" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...experience, endDate: "2021-12" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...experience, endDate: "" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...experience, current: true, endDate: "" }).success).toBe(true);
    });
    it("validates education years and project month ranges", () => {
        const education = { ...emptyProfileDraft("education"), name: "Đại học Bách khoa", startDate: "2018", endDate: "2022" };
        expect(profileEditorSchema.safeParse(education).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...education, endDate: "2017" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...education, startDate: "18" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...experience, section: "projects", name: "Website tuyển dụng" }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...experience, section: "projects", name: "Website tuyển dụng", endDate: "2020-01" }).success).toBe(false);
    });
    it("requires meaningful introduction and limits it to 1000 characters", () => {
        const intro = emptyProfileDraft("introduction");
        expect(profileEditorSchema.safeParse({ ...intro, description: "  " }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...intro, description: "a".repeat(1000) }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...intro, description: "a".repeat(1001) }).success).toBe(false);
    });
    it("limits skill count, rejects blanks and duplicates", () => {
        const skills = emptyProfileDraft("skills");
        expect(profileEditorSchema.safeParse(skills).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...skills, skills: ["React", "react"] }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...skills, skills: [" "] }).success).toBe(false);
        const names = Array.from({ length: 20 }, (_, index) => `Kỹ năng ${index}`);
        expect(profileEditorSchema.safeParse({ ...skills, skills: names }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...skills, skills: [...names, "SQL"] }).success).toBe(false);
    });
    it("requires distinct languages with a valid level", () => {
        const languages = emptyProfileDraft("languages");
        expect(profileEditorSchema.safeParse(languages).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...languages, languages: [{ name: "Tiếng Anh", level: "advanced" }, { name: "Tiếng Nhật", level: "beginner" }] }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...languages, languages: [{ name: "Tiếng Anh", level: "advanced" }, { name: "Tiếng Anh", level: "beginner" }] }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...languages, languages: [{ name: "Tiếng Anh", level: "invalid" }] }).success).toBe(false);
    });
    it("checks certificate file extension, MIME and 5MB limit", () => {
        const certificate = { ...emptyProfileDraft("certificates"), name: "Chứng chỉ React" };
        expect(profileEditorSchema.safeParse({ ...certificate, image: new File(["image"], "certificate.png", { type: "image/png" }) }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...certificate, image: new File(["text"], "certificate.png", { type: "text/plain" }) }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...certificate, image: new File(["text"], "certificate.svg", { type: "image/svg+xml" }) }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...certificate, image: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }) }).success).toBe(false);
    });
    it("validates personal email and phone and rejects a future birthday", () => {
        const personal = { ...emptyProfileDraft("personal"), name: "Nguyễn Minh Anh", email: "candidate@example.com" };
        expect(profileEditorSchema.safeParse(personal).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...personal, email: "invalid" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...personal, phone: "abc" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...personal, birthDate: "2999-01-01" }).success).toBe(false);
    });
    it("formats month and year consistently", () => {
        expect(formatMonthYear("2024-06")).toBe("06/2024");
        expect(formatMonthYear("2024")).toBe("2024");
        expect(formatMonthYear("2024-13")).toBe("");
    });
});
