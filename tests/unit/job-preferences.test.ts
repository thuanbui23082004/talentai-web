import { describe, expect, it } from "vitest";
import { INITIAL_JOB_PREFERENCES as EMPTY_JOB_PREFERENCES, jobPreferencesDraftSchema } from "@/features/profile/schemas/job-preferences";
import { jobPreferencesPayload, profileToJobPreferences } from "@/features/profile/job-preferences-mapping";
import profile from "../../contracts/examples/candidate-personal.json";
const INITIAL_JOB_PREFERENCES = { ...EMPTY_JOB_PREFERENCES, industries: ["it-software"], locations: ["21"], position: "Frontend Engineer", experience: "under-1", salaryMin: "15", salaryMax: "20" };

describe("job preference form and backend mapping", () => {
    it("starts empty and maps all supported backend fields", () => {
        expect(EMPTY_JOB_PREFERENCES.position).toBe("");
        const values = profileToJobPreferences(profile);
        expect(values).toMatchObject({ industries: ["it-software"], experience: "under-1", locations: ["21", "1"], salaryMin: "15", salaryMax: "25", hybrid: true, thirteenthMonth: true, healthInsurance: false });
        expect(jobPreferencesPayload(values)).toEqual({ desiredJobTitle: profile.desiredJobTitle, desiredIndustries: profile.desiredIndustries, experienceLevel: profile.experienceLevel, minDesiredSalary: 15000000, maxDesiredSalary: 25000000, currency: "VND", salaryNegotiable: false, desiredLocations: profile.desiredLocations, currentSeniorityLevels: profile.currentSeniorityLevels, employmentTypes: profile.employmentTypes, workPreferences: profile.workPreferences });
    });
    it("keeps out-of-list saved choices and does not overwrite salaries when negotiable", () => {
        const values = profileToJobPreferences({ ...profile, desiredIndustries: ["Ngành mới"], employmentTypes: ["Full-time"], experienceLevel: "CUSTOM_LEVEL" });
        expect(jobPreferencesDraftSchema.safeParse(values).success).toBe(true);
        const body = jobPreferencesPayload({ ...values, negotiable: true });
        expect(body.desiredIndustries).toEqual(["Ngành mới"]);
        expect(body.experienceLevel).toBe("CUSTOM_LEVEL");
        expect(body).not.toHaveProperty("minDesiredSalary");
        expect(body).not.toHaveProperty("fullName");
        expect(body).not.toHaveProperty("searchable");
        expect(jobPreferencesPayload({ ...values, salaryMin: "15.5", salaryMax: "20.75" })).toMatchObject({ minDesiredSalary: 15500000, maxDesiredSalary: 20750000 });
    });
    it("accepts the reference defaults and trims the desired position", () => {
        expect(jobPreferencesDraftSchema.safeParse(INITIAL_JOB_PREFERENCES).success).toBe(true);
        expect(jobPreferencesDraftSchema.parse({ ...INITIAL_JOB_PREFERENCES, position: "  React Developer  " }).position).toBe("React Developer");
    });
    it("requires industry, location, experience and position", () => {
        for (const change of [{ industries: [] }, { locations: [] }, { experience: "" }, { position: " " }]) expect(jobPreferencesDraftSchema.safeParse({ ...INITIAL_JOB_PREFERENCES, ...change }).success).toBe(false);
    });
    it("enforces selection limits, uniqueness and nonempty options", () => {
        for (const change of [
            { industries: ["it-hardware", "it-software", "banking", "marketing"] },
            { locations: ["1", "2", "3", "4", "5", "6"] },
            { levels: ["intern", "fresher", "junior", "middle", "senior", "lead"] },
            { workTypes: ["full_time", "part_time", "internship", "contract", "remote", "hybrid"] },
            { industries: ["banking", "banking"] }, { levels: [""] }, { locations: [""] },
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
