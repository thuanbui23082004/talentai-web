import { afterEach, describe, expect, it, vi } from "vitest";
import { handleSavedJobs } from "@/server/bff/candidate/saved-jobs-service";
import { handleBffRequest } from "@/server/bff/handler";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import saveExample from "../../contracts/examples/save-job.json";

const base = "http://localhost:3004/api/v1";
const token = "test-saved-access";
const id = saveExample.jobPostId;
const job = { jobPostId: id, companyId: id, title: "Backend Developer", location: "Đà Nẵng", salaryMin: 1000, salaryMax: 2000, salaryCurrency: "USD", isSalaryNegotiable: false, experienceLevel: "JUNIOR", jobType: "FULL_TIME", workMode: "REMOTE", publishedAt: null, deadline: "2026-12-31T23:59:59Z" };
const page = { items: [{ job, savedAt: "2026-11-04T10:00:00Z" }], page: 1, size: 2, totalElements: 3, totalPages: 2 };
function request(path = "", method = "GET", headers: Record<string, string> = {}) {
    return new Request(`http://localhost/api/bff/candidate/saved-jobs${path}`, {
        method, headers: { cookie: `access_token=${token}`, "x-csrf-token": csrfTokenFor({ access: token }), ...headers },
    });
}
function network(reply: () => Response | Promise<Response>, role = "CANDIDATE") {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${token}`);
        if (String(url).endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id, email: "saved@example.com", displayName: "Ứng viên", status: "ACTIVE", roles: [role] } } });
        return reply();
    });
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("real saved jobs adapter", () => {
    it("forwards the verified bearer token, converts pagination and maps jobs without inventing company details", async () => {
        const fetch = network(() => Response.json({ code: 200, data: page }));
        const response = await handleSavedJobs(request("?page=2&pageSize=2"), base);
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toContain("no-store");
        expect(String(fetch.mock.calls[1][0])).toBe(`${base}/saved-jobs?page=1&size=2`);
        expect(await response.json()).toMatchObject({ items: [{ job: { id, company: { id, name: "Tên chưa cập nhật" }, workMode: "REMOTE" }, savedAt: page.items[0].savedAt }], meta: { page: 2, pageSize: 2, totalItems: 3, totalPages: 2 } });
    });
    it("converts PUT to one backend POST and returns the documented save result", async () => {
        const fetch = network(() => Response.json({ code: 200, data: saveExample }));
        const response = await handleSavedJobs(request(`/${id}`, "PUT"), base);
        expect(await response.json()).toEqual(saveExample);
        const [, init] = fetch.mock.calls[1];
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({ jobPostId: id });
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it("sends DELETE with jobPostId in the query and accepts a bodyless 204", async () => {
        const fetch = network(() => new Response(null, { status: 204 }));
        const response = await handleSavedJobs(request(`/${id}`, "DELETE"), base);
        expect(response.status).toBe(204);
        expect(await response.text()).toBe("");
        expect(String(fetch.mock.calls[1][0])).toBe(`${base}/saved-jobs?jobPostId=${id}`);
        expect(fetch.mock.calls[1][1]?.method).toBe("DELETE");
    });
    it("rejects anonymous access, non-candidates and forged or cross-origin writes", async () => {
        const fetch = network(() => Response.json({}));
        expect((await handleSavedJobs(request("", "GET", { cookie: "" }), base)).status).toBe(401);
        const invalidHeaders: Record<string, string>[] = [{ "x-csrf-token": "bad" }, { origin: "https://evil.example" }, { "sec-fetch-site": "cross-site" }];
        for (const headers of invalidHeaders) {
            expect((await handleSavedJobs(request(`/${id}`, "PUT", headers), base)).status).toBe(403);
        }
        expect(fetch).not.toHaveBeenCalled();
        vi.restoreAllMocks(); const forbidden = network(() => Response.json({}), "RECRUITER");
        expect((await handleSavedJobs(request(), base)).status).toBe(403);
        expect(forbidden).toHaveBeenCalledTimes(1);
    });
    it("validates IDs, pagination and methods before reaching the business backend", async () => {
        const fetch = network(() => Response.json({}));
        for (const query of ["?page=0", "?page=10002", "?pageSize=101", "?q=unsupported"]) expect((await handleSavedJobs(request(query), base)).status).toBe(422);
        expect((await handleSavedJobs(request("/bad-id", "PUT"), base)).status).toBe(404);
        expect((await handleSavedJobs(request("", "POST"), base)).status).toBe(405);
        expect(fetch.mock.calls.every(([url]) => String(url).endsWith("/auth/me"))).toBe(true);
    });
    it.each([401, 403, 404, 400, 429, 500])("maps upstream %s safely and never retries writes", async status => {
        const fetch = network(() => Response.json({ message: "private details" }, { status }));
        const response = await handleSavedJobs(request(`/${id}`, "PUT"), base);
        expect(response.status).toBe(status === 400 ? 422 : status === 500 ? 503 : status);
        expect(JSON.stringify(await response.json())).not.toContain("private details");
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it("retries transient GET errors, and handles an empty list", async () => {
        vi.useFakeTimers(); let attempts = 0;
        network(() => ++attempts < 3 ? Response.json({}, { status: 503 }) : Response.json({ code: 200, data: { ...page, items: [], page: 0, totalElements: 0, totalPages: 0 } }));
        const pending = handleSavedJobs(request(), base);
        await vi.runAllTimersAsync();
        expect((await (await pending).json()).items).toEqual([]);
        expect(attempts).toBe(3);
    });
    it("rejects malformed responses and mismatched save IDs", async () => {
        network(() => Response.json({ code: 200, data: { ...saveExample, jobPostId: "00000000-0000-4000-8000-000000000000" } }));
        expect((await handleSavedJobs(request(`/${id}`, "PUT"), base)).status).toBe(503);
        network(() => Response.json({ code: 200, data: { ...page, items: [{ job: null, savedAt: "bad" }] } }));
        expect((await handleSavedJobs(request(), base)).status).toBe(503);
    });
    it("routes saved jobs to the same real service as public jobs, without falling back to mocks", async () => {
        vi.stubEnv("DATA_MODE", "mock"); vi.stubEnv("JOB_DATA_MODE", "real");
        network(() => Response.json({ code: 200, data: { ...page, items: [] } }));
        expect((await handleBffRequest(request())).status).toBe(200);
    });
});
