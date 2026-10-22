import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { getAuthStore, issueSession, resetMockAuth, type MockSession } from "@/server/bff/mock-auth-store";
import { resetMockApplications } from "@/server/bff/mock-applications";
import { createMockApplications, createMockApplicationInterviews } from "@/mocks/fixtures/applications";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { interviewCalendar, scheduledInterview } from "@/features/applications/presentation";
import interviewExample from "../../contracts/examples/application-interviews.json";
import applicationsExample from "../../contracts/examples/applications.json";

const mockApplications = createMockApplications(mockJobs);
const mockApplicationInterviews = createMockApplicationInterviews(mockApplications);

describe("candidate applications", () => {
    let session: MockSession;
    beforeEach(() => {
        vi.stubEnv("DATA_MODE", "mock"); resetMockAuth(); resetMockApplications();
        session = issueSession(getAuthStore().accounts.get("candidate@example.com")!.user); vi.useFakeTimers();
    });
    afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); resetMockAuth(); resetMockApplications(); });
    async function call(path: string, options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}, account = session) {
        const pending = handleBffRequest(new Request(`http://localhost/api/bff${path}`, {
            method: options.method ?? "GET", headers: { cookie: `access_token=${account.access}`, ...options.headers },
            ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        }));
        await vi.runAllTimersAsync(); return pending;
    }
    it("filters before pagination, supports array formats and stable ordering", async () => {
        const response = await call("/applications?status=submitted&status=reviewing&pageSize=2&page=2");
        expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
        const body = await response.json();
        expect(body.meta.totalItems).toBe(7);
        expect(body.items.map((item: { status: string }) => item.status)).toEqual(["submitted", "reviewing"]);
        const comma = await (await call("/applications?status=submitted,reviewing&pageSize=2&page=2")).json(); expect(comma).toEqual(body);
        const oldest = await (await call("/applications?sort=oldest&pageSize=1")).json(); expect(oldest.items[0]).toEqual(mockApplications[0]);
        expect(oldest).toEqual(applicationsExample);
        const search = await (await call("/applications?q=Chuyen%20vien%20tuyen%20dung")).json(); expect(search.items).toHaveLength(1);
        expect((await (await call("/applications?q=Dai%20Viet")).json()).items).toHaveLength(1);
        for (const path of ["?status=bad", "?sort=bad", "?page=0", "?pageSize=101", "?unsupported=true"]) expect((await call(`/applications${path}`)).status).toBe(422);
    });
    it("serves interview examples and protects candidate data", async () => {
        expect(await (await call("/candidate/interviews?pageSize=1")).json()).toEqual(interviewExample);
        expect((await call("/applications", { headers: { cookie: "" } })).status).toBe(401);
        const recruiter = issueSession(getAuthStore().accounts.get("recruiter@example.com")!.user);
        expect((await call("/candidate/interviews", {}, recruiter)).status).toBe(403);
        expect((await call("/applications", {}, recruiter)).status).toBe(403);
        expect((await (await call("/applications", { headers: { "x-mock-scenario": "empty" } })).json()).items).toEqual([]);
        expect((await call("/candidate/interviews", { headers: { "x-mock-scenario": "error" } })).status).toBe(500);
    });
    it("confirms invitations with CSRF, rejects duplicates and isolates accounts", async () => {
        const path = `/candidate/interviews/${mockApplicationInterviews[0].id}/respond`;
        const body = { response: "accepted" };
        expect((await call(path, { method: "POST", body })).status).toBe(403);
        const headers = { "x-csrf-token": session.csrf };
        expect((await call(path, { method: "POST", body, headers: { ...headers, origin: "https://evil.example" } })).status).toBe(403);
        expect((await call(path, { method: "POST", body, headers: { ...headers, "sec-fetch-site": "cross-site" } })).status).toBe(403);
        expect((await call(path, { method: "POST", body: { response: "bad" }, headers })).status).toBe(422);
        expect((await (await call(path, { method: "POST", body, headers })).json()).invitationStatus).toBe("accepted");
        expect((await call(path, { method: "POST", body, headers })).status).toBe(409);
        expect((await (await call("/candidate/interviews?invitationStatus=pending")).json()).items).toEqual([]);
        const first = await (await call("/candidate/interviews")).json(); expect(first.items[0].invitationStatus).toBe("accepted");
        const original = getAuthStore().accounts.get("candidate@example.com")!;
        const user = { ...original.user, id: "30000000-0000-4000-8000-000000000099", email: "second@example.com" };
        getAuthStore().accounts.set(user.email, { ...original, user });
        const other = issueSession(user);
        expect((await (await call("/candidate/interviews", {}, other)).json()).items[0].invitationStatus).toBe("pending");
    });
    it("handles missing schedules and exports Vietnamese calendar data safely", () => {
        expect(scheduledInterview(mockApplicationInterviews, mockApplications[0].id)).toBeUndefined();
        const item = mockApplicationInterviews[0]; expect(scheduledInterview([ { ...item, status: "cancelled" }, item ], item.applicationId)).toEqual(item);
        const calendar = interviewCalendar({ ...item, message: "Chào bạn; trao đổi, dự án\nDòng hai" });
        expect(calendar).toContain("DTSTART:20261026T020000Z\r\n");
        expect(calendar).toContain("Chào bạn\\; trao đổi\\, dự án\\nDòng hai");
        expect(calendar.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    });
});
