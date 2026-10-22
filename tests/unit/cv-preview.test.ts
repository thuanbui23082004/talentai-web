import { describe, expect, it } from "vitest";
import { cvPreviewSchema, validateCvSelection } from "@/features/cv/schemas/cv-preview";

describe("CV design preview", () => {
    const values = { title: " CV kinh doanh ", person: " Nguyễn Minh Anh ", position: "Kinh doanh", introduction: "Giới thiệu" };
    it("trims values and requires a title, person and position", () => {
        expect(cvPreviewSchema.parse(values).title).toBe("CV kinh doanh");
        for (const key of ["title", "person", "position"]) expect(cvPreviewSchema.safeParse({ ...values, [key]: " " }).success).toBe(false);
        expect(cvPreviewSchema.safeParse({ ...values, title: "a".repeat(151) }).success).toBe(false);
        expect(cvPreviewSchema.safeParse({ ...values, introduction: "a".repeat(1001) }).success).toBe(false);
    });
    it("accepts matching PDF/DOCX files up to 5MB and rejects invalid selections", () => {
        expect(validateCvSelection({ name: "CV.PDF", type: "application/pdf", size: 5 * 1024 * 1024 })).toBeUndefined();
        expect(validateCvSelection({ name: "CV.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 100 })).toBeUndefined();
        expect(validateCvSelection({ name: "CV.pdf", type: "", size: 100 })).toBeUndefined();
        for (const file of [{ name: "CV.doc", type: "application/msword", size: 100 }, { name: "CV.pdf", type: "image/png", size: 100 }, { name: "CV.exe", type: "", size: 100 }, { name: "CV.pdf", type: "application/pdf", size: 0 }, { name: "CV.pdf", type: "application/pdf", size: 5 * 1024 * 1024 + 1 }]) expect(validateCvSelection(file)).toBeTruthy();
    });
});
