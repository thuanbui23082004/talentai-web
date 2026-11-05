import { describe, expect, it } from "vitest";
import { companyImageFileSchema, companyOnboardingSchema } from "@/features/company/schemas/onboarding";
import { companyInputSchema } from "@/features/company/schemas/company";
import { recruiterIndustries } from "@/mocks/fixtures/recruiter-catalog";

const valid = { name: "  Công ty Sao Mai  ", city: "Đà Nẵng", address: "12 Đường Hoa, Phường Hải Châu", contactPhone: "0912345678", taxCode: "0123456789", description: "Phát triển phần mềm cho doanh nghiệp.", industryId: recruiterIndustries[0].id };

describe("company onboarding", () => {
    it("requires company identity and valid contact information before saving", () => {
        for (const change of [{ name: " " }, { city: "" }, { city: "Unknown" }, { contactPhone: "123" }, { address: "" }, { industryId: "" }, { taxCode: "1234" }, { taxCode: "" }, { taxCode: "   " }, { description: " " }]) {
            expect(companyOnboardingSchema.safeParse({ ...valid, ...change }).success).toBe(false);
        }
    });
    it("explains when the required tax code is missing", () => {
        const result = companyOnboardingSchema.safeParse({ ...valid, taxCode: "   " });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.flatten().fieldErrors.taxCode).toContain("Vui lòng nhập mã số thuế công ty.");
    });
    it("maps validated input into the existing company contract without creating a representative", () => {
        const { industryId, website, companySize, foundedYear, ...fields } = companyOnboardingSchema.parse(valid);
        const payload = companyInputSchema.parse({ ...fields, website: website || undefined, companySize: companySize ? Number(companySize) : undefined, foundedYear: foundedYear ? Number(foundedYear) : undefined, industryIds: [industryId] });
        expect(payload.name).toBe("Công ty Sao Mai");
        expect(payload.industryIds).toEqual([valid.industryId]);
        expect(payload).not.toHaveProperty("password");
        expect(companyOnboardingSchema.safeParse({ ...valid, taxCode: "0123456789", contactPhone: "+84912345678" }).success).toBe(true);
    });
    it("accepts skipped optional details and validates populated fields", () => {
        expect(companyOnboardingSchema.parse(valid)).toMatchObject({ website: "", companySize: "", foundedYear: "" });
        expect(companyOnboardingSchema.safeParse({ ...valid, website: "https://example.com", companySize: "50", foundedYear: "2015" }).success).toBe(true);
        for (const fields of [{ website: "example.com" }, { website: "javascript:alert(1)" }, { companySize: "0" }, { companySize: "2.5" }, { companySize: "2147483648" }, { foundedYear: "3000" }]) expect(companyOnboardingSchema.safeParse({ ...valid, ...fields }).success).toBe(false);
    });
    it("validates upload types, empty files and size before preview", () => {
        expect(companyImageFileSchema.safeParse(new File(["image"], "logo.png", { type: "image/png" })).success).toBe(true);
        expect(companyImageFileSchema.safeParse(new File([], "logo.png", { type: "image/png" })).success).toBe(false);
        expect(companyImageFileSchema.safeParse(new File(["image"], "logo.svg", { type: "image/svg+xml" })).success).toBe(false);
        expect(companyImageFileSchema.safeParse(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "cover.jpg", { type: "image/jpeg" })).success).toBe(false);
    });
});
