import { describe, expect, it } from "vitest";
import { companyOnboardingSchema } from "@/features/company/schemas/onboarding";
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
        const { industryId, ...fields } = companyOnboardingSchema.parse(valid);
        const payload = companyInputSchema.parse({ ...fields, industryIds: [industryId] });
        expect(payload.name).toBe("Công ty Sao Mai");
        expect(payload.industryIds).toEqual([valid.industryId]);
        expect(payload).not.toHaveProperty("password");
        expect(companyOnboardingSchema.safeParse({ ...valid, taxCode: "0123456789", contactPhone: "+84912345678" }).success).toBe(true);
    });
});
