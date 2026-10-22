import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { getAuthStore, issueSession, resetMockAuth, type MockSession } from "@/server/bff/mock-auth-store";
import { resetMockSavedJobs } from "@/server/bff/mock-saved-jobs";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { createMockSavedJobs } from "@/mocks/fixtures/saved-jobs";
import { filterSavedJobs, savedJobStatus } from "@/features/jobs/saved-jobs-presentation";
import example from "../../contracts/examples/saved-jobs.json";

describe("saved jobs BFF", () => {
    let session: MockSession;
    beforeEach(() => {
        vi.stubEnv("DATA_MODE", "mock"); resetMockAuth(); resetMockSavedJobs();
        session = issueSession(getAuthStore().accounts.get("candidate@example.com")!.user); vi.useFakeTimers();
    });
    afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); resetMockAuth(); resetMockSavedJobs(); });
    async function call(path = "", method = "GET", headers: Record<string, string> = {}, account = session) {
        const result = handleBffRequest(new Request(`http://localhost/api/bff/candidate/saved-jobs${path}`, { method, headers: { cookie: `access_token=${account.access}`, ...headers } }));
        await vi.runAllTimersAsync(); return result;
    }
    it("serves contract examples with newest-first pagination and validates filters", async () => {
        const response = await call("?pageSize=1");
        expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.json()).toEqual(example);
        const second = await (await call("?pageSize=1&page=2")).json(); expect(second.items[0].job.id).toBe(mockJobs[1].id);
        for (const path of ["?page=0", "?pageSize=101", "?q=unsupported"]) expect((await call(path)).status).toBe(422);
        expect((await (await call("", "GET", { "x-mock-scenario": "empty" })).json()).items).toEqual([]);
    });
    it("requires a candidate session and protects writes with CSRF and Origin", async () => {
        expect((await call("", "GET", { cookie: "" })).status).toBe(401);
        const recruiter = issueSession(getAuthStore().accounts.get("recruiter@example.com")!.user);
        expect((await call("", "GET", {}, recruiter)).status).toBe(403);
        const path = `/${mockJobs[0].id}`;
        expect((await call(path, "DELETE")).status).toBe(403);
        expect((await call(path, "PUT", { "x-csrf-token": session.csrf, origin: "https://evil.example" })).status).toBe(403);
        expect((await call(path, "DELETE", { "x-csrf-token": session.csrf, "sec-fetch-site": "cross-site" })).status).toBe(403);
    });
    it("persists remove/restore, keeps PUT idempotent and isolates accounts", async () => {
        const headers = { "x-csrf-token": session.csrf }; const path = `/${mockJobs[0].id}`;
        expect((await call(path, "DELETE", headers)).status).toBe(204);
        expect((await (await call()).json()).meta.totalItems).toBe(8);
        expect((await call(path, "DELETE", headers)).status).toBe(404);
        const restored = await (await call(path, "PUT", headers)).json();
        expect((await (await call(path, "PUT", headers)).json()).savedAt).toBe(restored.savedAt);
        expect((await (await call()).json()).meta.totalItems).toBe(9);
        const otherRecord = getAuthStore().accounts.get("candidate@example.com")!;
        const other = { ...otherRecord.user, id: "30000000-0000-4000-8000-000000000099", email: "saved-second@example.com" };
        getAuthStore().accounts.set(other.email, { ...otherRecord, user: other }); const otherSession = issueSession(other);
        expect((await call(path, "DELETE", headers)).status).toBe(204);
        expect((await (await call("", "GET", {}, otherSession)).json()).meta.totalItems).toBe(9);
        expect((await call(`/${mockJobs[12].id}`, "PUT", headers)).status).toBe(200);
        expect((await call("/10000000-0000-4000-8000-999999999999", "PUT", headers)).status).toBe(404);
    });
    it("failed writes preserve the collection and real proxy stays closed", async () => {
        expect((await call(`/${mockJobs[0].id}`, "DELETE", { "x-csrf-token": session.csrf, "x-mock-scenario": "error" })).status).toBe(500);
        expect((await (await call()).json()).meta.totalItems).toBe(9);
        vi.stubEnv("DATA_MODE", "real"); vi.stubEnv("BACKEND_API_URL", "https://backend.example");
        expect((await call()).status).toBe(503);
    });
});

describe("saved job filtering", () => {
    const items = createMockSavedJobs(mockJobs); const today = "2026-10-22";
    it("distinguishes closing dates, expired and paused jobs", () => {
        expect(savedJobStatus({ ...mockJobs[0], applicationDeadline: "2026-10-22" }, today)).toBe("expiring");
        expect(savedJobStatus({ ...mockJobs[0], applicationDeadline: "2026-10-29" }, today)).toBe("expiring");
        expect(savedJobStatus({ ...mockJobs[0], applicationDeadline: "2026-10-30" }, today)).toBe("open");
        expect(savedJobStatus({ ...mockJobs[0], applicationDeadline: "2026-10-21" }, today)).toBe("closed");
        expect(savedJobStatus({ ...mockJobs[0], status: "paused" }, today)).toBe("closed");
    });
    it("filters the complete collection and sorts without changing its source", () => {
        const defaults = { q: "", city: "", tab: "all" as const, sort: "newest" as const };
        expect(filterSavedJobs(items, { ...defaults, q: "sao viet" }, today)[0].job.id).toBe(mockJobs[0].id);
        expect(filterSavedJobs(items, { ...defaults, tab: "open" }, today)).toHaveLength(8);
        expect(filterSavedJobs(items, { ...defaults, tab: "closed" }, today)).toHaveLength(1);
        expect(filterSavedJobs(items, { ...defaults, city: "Hà Nội" }, today)).toHaveLength(2);
        expect(filterSavedJobs(items, { ...defaults, sort: "oldest" }, today)[0].job.status).toBe("closed");
        const sorted = filterSavedJobs(items, { ...defaults, sort: "deadline" }, today);
        expect(sorted[0].job.id).toBe(mockJobs[2].id); expect(sorted.at(-1)?.job.status).toBe("closed");
        expect(items[0].job.id).toBe(mockJobs[0].id);
    });
});
