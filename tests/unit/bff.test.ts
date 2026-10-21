import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { mockJobs } from "@/mocks/fixtures/jobs";
import example from "../../contracts/examples/jobs.json";

const request = (query = "", scenario?: string) => new Request(`http://localhost/api/bff/jobs${query}`, { headers: scenario ? { "x-mock-scenario": scenario } : {} });

describe("mock-first BFF", () => {
  beforeEach(() => { vi.stubEnv("DATA_MODE", "mock"); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  async function run(input: Request) {
    const pending = handleBffRequest(input);
    await vi.runAllTimersAsync();
    return pending;
  }

  it("serves typed fixtures matching contract examples without contacting a backend", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    const response = await run(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.meta).toEqual(example.meta);
    expect(mockJobs).toEqual(example.items);
    expect(body.items).toEqual([...mockJobs].reverse());
    expect(network).not.toHaveBeenCalled();
  });
  it("filters Vietnamese keywords and city before paginating", async () => {
    const response = await run(request("?q=react&city=da+nang&pageSize=1"));
    const body = await response.json();
    expect(body.items.map((job: { id: string }) => job.id)).toEqual([mockJobs[0].id]);
    expect(body.meta).toEqual({ page: 1, pageSize: 1, totalItems: 1, totalPages: 1 });
    const second = await (await run(request("?page=2&pageSize=1&sort=salary_desc"))).json();
    expect(second.items[0].id).toBe(mockJobs[0].id);
  });
  it("supports empty and error scenarios", async () => {
    expect((await (await run(request("", "empty"))).json()).items).toEqual([]);
    for (const [scenario, status, code] of [["error", 500, "INTERNAL_ERROR"], ["unauthorized", 401, "UNAUTHENTICATED"], ["forbidden", 403, "FORBIDDEN"], ["conflict", 409, "CONFLICT"], ["locked", 423, "ACCOUNT_LOCKED"]] as const) {
      const response = await run(request("", scenario));
      expect(response.status).toBe(status);
      expect((await response.json()).error.code).toBe(code);
    }
  });
  it("applies salary overlap, experience, level and work type filters together", async () => {
    const result = await (await run(request("?salaryMin=20000000&minExperience=3&level=senior&workType=full_time"))).json();
    expect(result.items.map((job: { id: string }) => job.id)).toEqual([mockJobs[3].id]);
    const remote = await (await run(request("?workType=remote&maxExperience=3"))).json();
    expect(remote.items.map((job: { id: string }) => job.id)).toEqual([mockJobs[5].id]);
    for (const query of ["?salaryMin=200&salaryMax=100", "?minExperience=5&maxExperience=1", "?workType=invalid", "?level=invalid", "?gender=male", "?salaryMin=-1"]) expect((await run(request(query))).status).toBe(422);
    const multi = await (await run(request("?level=senior&level=middle"))).json();
    expect(multi.items).toHaveLength(3);
  });
  it("rejects invalid or unimplemented filters and personal ranking without auth", async () => {
    for (const query of ["?page=0", "?pageSize=101", "?page=bad", "?industryId=unknown", "?sort=invalid"]) {
      expect((await run(request(query))).status).toBe(422);
    }
    expect((await run(request("?sort=match_score"))).status).toBe(401);
  });
  it("does not fake success for unimplemented endpoints or mutations", async () => {
    expect((await run(new Request("http://localhost/api/bff/auth/not-implemented", { method: "POST" }))).status).toBe(503);
    expect((await run(new Request("http://localhost/api/bff/jobs", { method: "DELETE" }))).status).toBe(503);
  });
  it("returns a safe error when configuration is invalid", async () => {
    vi.stubEnv("DATA_MODE", "real"); vi.stubEnv("BACKEND_API_URL", "");
    const response = await run(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("BACKEND_API_URL");
  });
});
