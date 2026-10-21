import { afterEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { getMockCompany, getMockCompanyJobs } from "@/server/bff/mock-companies";
import { mockJobs } from "@/mocks/fixtures/jobs";
import example from "../../contracts/examples/company-detail.json";

describe("company detail and company jobs", () => {
    afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
    it("serves public company details through the BFF and rejects missing companies", async () => {
        vi.stubEnv("DATA_MODE", "mock");
        vi.useFakeTimers();
        const id = mockJobs[0].company.id;
        const pending = handleBffRequest(new Request(`http://localhost/api/bff/companies/${id}`));
        await vi.runAllTimersAsync();
        const response = await pending;
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual(example);
        expect(body.id).toBe(id);
        expect(body.description.length).toBeGreaterThan(420);
        expect(body).not.toHaveProperty("rating");
        expect(getMockCompany("00000000-0000-4000-8000-000000000000").status).toBe(404);
    });
    it("filters open jobs by company ID before pagination", async () => {
        const id = mockJobs[0].company.id;
        const response = getMockCompanyJobs(id, new URLSearchParams("pageSize=1"));
        const result = await response.json();
        expect(result.items).toHaveLength(1);
        expect(result.items.every((job: { company: { id: string }; status: string }) => job.company.id === id && job.status === "open")).toBe(true);
        const empty = await getMockCompanyJobs(id, new URLSearchParams(), true).json();
        expect(empty.items).toEqual([]);
        expect(getMockCompanyJobs(id, new URLSearchParams("page=0")).status).toBe(422);
        expect(getMockCompanyJobs("00000000-0000-4000-8000-000000000000", new URLSearchParams()).status).toBe(404);
    });
});
