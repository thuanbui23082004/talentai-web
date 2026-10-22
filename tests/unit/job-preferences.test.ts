import { describe, expect, it } from "vitest";
import { INITIAL_JOB_PREFERENCES, jobPreferencesDraftSchema } from "@/features/profile/schemas/job-preferences";

describe("job preference presentation draft", () => {
    it("accepts the reference defaults and trims the desired position", () => {
        expect(jobPreferencesDraftSchema.safeParse(INITIAL_JOB_PREFERENCES).success).toBe(true);
        expect(jobPreferencesDraftSchema.parse({ ...INITIAL_JOB_PREFERENCES, position: "  React Developer  " }).position).toBe("React Developer");
    });
    it("requires industry, location, experience and position", () => {
        for (const change of [{ industries: [] }, { locations: [] }, { experience: "" }, { position: " " }]) expect(jobPreferencesDraftSchema.safeParse({ ...INITIAL_JOB_PREFERENCES, ...change }).success).toBe(false);
    });
    it("enforces selection limits, uniqueness and supported options", () => {
        for (const change of [
            { industries: ["it-hardware", "it-software", "banking", "marketing"] },
            { locations: ["01", "04", "08", "11", "12", "14"] },
            { levels: ["intern", "fresher", "junior", "middle", "senior", "lead"] },
            { workTypes: ["full_time", "part_time", "internship", "contract", "remote", "hybrid"] },
            { industries: ["banking", "banking"] }, { levels: ["invalid"] }, { locations: ["unknown"] },
        ]) expect(jobPreferencesDraftSchema.safeParse({ ...INITIAL_JOB_PREFERENCES, ...change }).success).toBe(false);
    });
    it("validates salary ranges and decimal precision", () => {
        expect(jobPreferencesDraftSchema.safeParse({ ...INITIAL_JOB_PREFERENCES, salaryMin: "15.5", salaryMax: "20.75" }).success).toBe(true);
        expect(jobPreferencesDraftSchema.safeParse({ ...INITIAL_JOB_PREFERENCES, salaryMin: "20", salaryMax: "20" }).success).toBe(true);
        for (const change of [{ salaryMin: "30", salaryMax: "20" }, { salaryMin: "-1" }, { salaryMax: "0" }, { salaryMin: "abc" }, { salaryMax: "Infinity" }, { salaryMin: "1.234" }, { salaryMin: "" }]) expect(jobPreferencesDraftSchema.safeParse({ ...INITIAL_JOB_PREFERENCES, ...change }).success).toBe(false);
    });
    it("allows blank salaries when negotiable and keeps advanced choices", () => {
        const result = jobPreferencesDraftSchema.parse({ ...INITIAL_JOB_PREFERENCES, negotiable: true, salaryMin: "", salaryMax: "", levels: ["senior"], workTypes: ["remote"] });
        expect(result.levels).toEqual(["senior"]);
        expect(result.workTypes).toEqual(["remote"]);
    });
});
