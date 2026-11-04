import { afterEach, describe, expect, it, vi } from "vitest";
import { handleJobService } from "@/server/bff/public/job-service";
import { handleBffRequest } from "@/server/bff/handler";

const id = "90000000-0000-4000-8000-000000000001";
const job = { jobPostId: id, companyId: id, title: "Backend Developer", location: "Đà Nẵng", salaryMin: 1000, salaryMax: 2000, salaryCurrency: "USD", isSalaryNegotiable: false, experienceLevel: "EXPERT", jobType: "FULL_TIME", workMode: "REMOTE", publishedAt: "2026-11-04T00:00:00Z", deadline: "2026-12-31T23:59:59Z" };
const request = (query = "") => new Request(`http://localhost/api/bff/jobs${query}`);
function mock(body: unknown) { return vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ code: 200, data: body })); }
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("job-posting adapter", () => {
    it("maps only supported filters and paging without changing work mode into job type", async () => {
        const fetch = mock({ items: [job], page: 1, size: 12, totalElements: 13, totalPages: 2 });
        const response = await handleJobService(request("?q=Backend&city=Đà+Nẵng&categoryId=1&experienceLevel=EXPERT&jobType=FULL_TIME&workMode=REMOTE&salaryMin=1000&salaryMax=2000&salaryCurrency=USD&isSalaryNegotiable=false&sort=salary_desc&page=2&pageSize=12"), "http://localhost:3004/api/v1");
        expect(response.status).toBe(200);
        const url = new URL(String(fetch.mock.calls[0][0]));
        expect(Object.fromEntries(url.searchParams)).toEqual({ keyword: "Backend", location: "Đà Nẵng", categoryId: "1", experienceLevel: "EXPERT", jobType: "FULL_TIME", workMode: "REMOTE", salaryMin: "1000", salaryMax: "2000", salaryCurrency: "USD", isSalaryNegotiable: "false", sort: "salaryMax,desc", page: "1", size: "12" });
        const result = await response.json();
        expect(result.meta).toEqual({ page: 2, pageSize: 12, totalItems: 13, totalPages: 2 });
        expect(result.items[0]).toMatchObject({ id, experienceLevel: "EXPERT", workType: "full_time", workMode: "REMOTE", salary: { min: 1000, max: 2000, currency: "USD" }, applicationDeadline: "2026-12-31" });
        expect(result.items[0]).not.toHaveProperty("minExperienceYears");
    });
    it("rejects conflicting old criteria instead of silently ignoring them", async () => {
        const fetch = mock({});
        for (const query of ["?minExperience=3", "?workType=remote", "?wardCode=00008", "?sort=relevance", "?salaryMin=200&salaryMax=100", "?jobType=REMOTE", "?experienceLevel=MANAGER"]) {
            expect((await handleJobService(request(query), "http://localhost:3004/api/v1")).status).toBe(422);
        }
        expect(fetch).not.toHaveBeenCalled();
    });
    it("loads real category shape and job details using the same mapper", async () => {
        mock([{ categoryId: 1, categoryName: "Software Engineering" }]);
        expect(await (await handleJobService(request("/categories"), "http://localhost:3004/api/v1")).json()).toEqual([{ categoryId: 1, categoryName: "Software Engineering" }]);
        mock({ ...job, description: "Mô tả", requirements: "Yêu cầu", benefits: "Quyền lợi", headCount: 2, skills: [{ skillId: 1, skillName: "Java" }] });
        const detail = await (await handleJobService(request(`/${id}`), "http://localhost:3004/api/v1")).json();
        expect(detail).toMatchObject({ id, description: "Mô tả", requirements: "Yêu cầu", headcount: 2, skills: ["Java"] });
    });
    it("supports empty data and never exposes raw backend failures or broken payloads", async () => {
        mock({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
        expect((await (await handleJobService(request(), "http://localhost:3004/api/v1")).json()).items).toEqual([]);
        vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ secret: "private" }, { status: 404 }));
        const missing = await handleJobService(request(`/${id}`), "http://localhost:3004/api/v1");
        expect(missing.status).toBe(404); expect(JSON.stringify(await missing.json())).not.toContain("private");
        mock({ items: "invalid" });
        expect((await handleJobService(request(), "http://localhost:3004/api/v1")).status).toBe(503);
    });
    it("selects the real job service independently from other mock features", async () => {
        vi.stubEnv("DATA_MODE", "mock"); vi.stubEnv("JOB_DATA_MODE", "real");
        mock({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
        expect((await handleBffRequest(request())).status).toBe(200);
    });
});
