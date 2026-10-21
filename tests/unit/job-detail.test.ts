import { afterEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { createMockJobDetails } from "@/mocks/fixtures/job-details";
import { mockJobs } from "@/mocks/fixtures/jobs";

const mockJobDetails = createMockJobDetails(mockJobs);

describe("public job details", () => {
    afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
    it("returns the requested detail and excludes unknown or closed jobs", async () => {
        vi.stubEnv("DATA_MODE", "mock");
        vi.useFakeTimers();
        const run = async (id: string, scenario?: string) => {
            const pending = handleBffRequest(new Request(`http://localhost/api/bff/jobs/${id}`, { headers: scenario ? { "x-mock-scenario": scenario } : {} }));
            await vi.runAllTimersAsync();
            return pending;
        };
        const job = mockJobDetails[3];
        expect(await (await run(job.id)).json()).toEqual(job);
        expect((await run("00000000-0000-4000-8000-000000000000")).status).toBe(404);
        expect((await run(job.id, "empty")).status).toBe(404);
        expect((await run(job.id, "error")).status).toBe(500);
        expect(job.description.length).toBeGreaterThan(100);
        expect(job.requirements).toContain(job.skills![0]);
    });
});
