import { describe, expect, it } from "vitest";
import { applicationPreviewSchema } from "@/features/applications/schemas/application-preview";

describe("application preview validation", () => {
    const values = { cv: "sample-cv", location: "Đà Nẵng", coverLetter: "", allowAi: false, acceptedTerms: true };
    it("accepts an optional cover letter and does not require AI consent", () => {
        expect(applicationPreviewSchema.safeParse(values).success).toBe(true);
        expect(applicationPreviewSchema.parse({ ...values, coverLetter: " Giới thiệu " }).coverLetter).toBe("Giới thiệu");
    });
    it("requires a CV, job location and explicit terms confirmation", () => {
        for (const changes of [{ cv: "" }, { location: "" }, { acceptedTerms: false }]) {
            expect(applicationPreviewSchema.safeParse({ ...values, ...changes }).success).toBe(false);
        }
    });
    it("limits the introduction to the contract's existing 3000 character limit", () => {
        expect(applicationPreviewSchema.safeParse({ ...values, coverLetter: "a".repeat(3000) }).success).toBe(true);
        expect(applicationPreviewSchema.safeParse({ ...values, coverLetter: "a".repeat(3001) }).success).toBe(false);
    });
});
