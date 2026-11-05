import { describe, expect, it } from "vitest";
import { emptyProfileDraft, profileEditorSchema } from "@/features/profile/schemas/profile-editor";
import { careerToEntries, certificatePayload, educationPayload, experiencePayload } from "@/features/profile/career-mapping";
import example from "../../contracts/examples/candidate-career.json";

describe("profile editor and backend mapping", () => {
    it("requires identity fields but accepts missing optional dates", () => {
        expect(profileEditorSchema.safeParse(emptyProfileDraft("experience")).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...emptyProfileDraft("experience"), company: "Sao Mai", position: "Engineer" }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...emptyProfileDraft("education"), name: "Trường kiểm thử" }).success).toBe(true);
    });
    it("validates actual dates, ordering, and current employment/study", () => {
        const values = { ...emptyProfileDraft("experience"), company: "Sao Mai", position: "Engineer", startDate: "2024-02-29", endDate: "2024-03-01" };
        expect(profileEditorSchema.safeParse(values).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...values, startDate: "2023-02-29" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...values, endDate: "2023-01-01" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...values, current: true, endDate: "2023-01-01" }).success).toBe(true);
        expect(profileEditorSchema.safeParse({ ...values, section: "education", name: "School", current: true }).success).toBe(true);
    });
    it("keeps IDs, free-form degrees and optional fields while mapping backend records", () => {
        const entries = careerToEntries(example);
        expect(entries.experience?.[0]).toMatchObject({ id: "profile-exp-1", values: { position: example.experience[0].title, address: "Đà Nẵng", startDate: "2022-01-15", current: true } });
        expect(entries.education?.[0].values.degree).toBe(example.education[0].degree);
        expect(entries.certificates?.[0].values.credentialUrl).toBe(example.certificates[0].credentialUrl);
        expect(entries.skills?.[0].values.skills).toEqual(example.skills.skills);
    });
    it("preserves unchanged timestamps and sends null end dates for ongoing entries", () => {
        const entries = careerToEntries(example);
        const values = entries.experience![0].values;
        expect(experiencePayload(values, example.experience[0])).toMatchObject({ title: values.position, startDate: "2022-01-15T10:30:00Z", endDate: null, current: true });
        expect(experiencePayload({ ...values, startDate: "2025-01-15" }, example.experience[0]).startDate).toBe("2025-01-15T00:00:00Z");
        expect(educationPayload({ ...entries.education![0].values, current: true })).toMatchObject({ isStudying: true, endDate: null });
        expect(certificatePayload(entries.certificates![0].values)).toMatchObject({ issuedAt: "2024-01-15T00:00:00Z", expiresAt: null });
    });
    it("validates certificate metadata and HTTP URLs", () => {
        const values = { ...emptyProfileDraft("certificates"), name: "Certificate", credentialUrl: "https://example.com/cert" };
        expect(profileEditorSchema.safeParse(values).success).toBe(true);
        for (const credentialUrl of ["bad", "javascript:alert(1)", "ftp://example.com/cert"]) expect(profileEditorSchema.safeParse({ ...values, credentialUrl }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...values, startDate: "2025-01-01", endDate: "2024-01-01" }).success).toBe(false);
    });
    it("matches skill length without imposing an undocumented count limit", () => {
        const values = emptyProfileDraft("skills");
        expect(profileEditorSchema.safeParse(values).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...values, skills: ["React", "react"] }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...values, skills: ["x".repeat(101)] }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...values, skills: Array.from({ length: 25 }, (_, i) => `Skill ${i}`) }).success).toBe(true);
    });
    it("validates personal, introduction, project and language previews", () => {
        expect(profileEditorSchema.safeParse({ ...emptyProfileDraft("personal"), name: "Name", email: "invalid" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...emptyProfileDraft("introduction"), description: "x".repeat(1001) }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...emptyProfileDraft("projects"), name: "Project", startDate: "2024-01", endDate: "2023-01" }).success).toBe(false);
        expect(profileEditorSchema.safeParse({ ...emptyProfileDraft("languages"), languages: [{ name: "English", level: "advanced" }, { name: "English", level: "beginner" }] }).success).toBe(false);
    });
});
