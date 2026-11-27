import { describe, expect, it } from "vitest";
import { jobSchema } from "@/server/bff/public/job-service";

describe("job service response", () => {
    it("accepts Java UUIDs used by seeded jobs and companies", () => {
        expect(jobSchema.safeParse({
            jobPostId: "e44d3aa0-b1fa-41d1-9c45-116edc8a593f",
            companyId: "a1000000-0000-0000-0000-000000000001",
            title: "Extended deadline",
            location: "Da Nang",
            isSalaryNegotiable: false,
            experienceLevel: "JUNIOR",
            jobType: "FULL_TIME",
            workMode: "HYBRID",
        }).success).toBe(true);
    });
});
