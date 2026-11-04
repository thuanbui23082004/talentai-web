import { describe, expect, it } from "vitest";
import { companyOnboardingSchema } from "@/features/company/schemas/onboarding";
import { companyInputSchema } from "@/features/company/schemas/company";
import { recruiterIndustries } from "@/mocks/fixtures/recruiter-catalog";

const valid = { name: "  Công ty Sao Mai  ", city: "Đà Nẵng", address: "12 Đường Hoa, Phường Hải Châu", contactPhone: "0912345678", taxCode: "0123456789", industryId: recruiterIndustries[0].id };

describe("company onboarding", () => {
    it("requires company identity and valid contact information before saving", () => {
        for (const change of [{ name: " " }, { city: "" }, { city: "Unknown" }, { contactPhone: "123" }, { address: "" }, { industryId: "" }, { taxCode: "1234" }]) {
            expect(companyOnboardingSchema.safeParse({ ...valid, ...change }).success).toBe(false);
        }
    });
    it("maps validated input into the existing company contract without creating a representative", () => {
        const { industryId, ...fields } = companyOnboardingSchema.parse(valid);
        const payload = companyInputSchema.parse({ ...fields, industryIds: [industryId] });
        expect(payload.name).toBe("Công ty Sao Mai");
        expect(payload.industryIds).toEqual([valid.industryId]);
        expect(payload).not.toHaveProperty("password");
        expect(companyOnboardingSchema.safeParse({ ...valid, taxCode: "", contactPhone: "+84912345678" }).success).toBe(true);
    });
});
