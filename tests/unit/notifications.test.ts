import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { getAuthStore, issueSession, resetMockAuth, type MockSession } from "@/server/bff/mock-auth-store";
import { resetMockNotifications } from "@/server/bff/mock-notifications";
import { mockNotifications } from "@/mocks/fixtures/notifications";
import example from "../../contracts/examples/notifications.json";

describe("notifications BFF", () => {
    let session: MockSession;
    beforeEach(() => {
        vi.stubEnv("DATA_MODE", "mock");
        resetMockAuth(); resetMockNotifications();
        session = issueSession(getAuthStore().accounts.get("candidate@example.com")!.user);
        vi.useFakeTimers();
    });
    afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); resetMockAuth(); resetMockNotifications(); });
    async function call(path = "", method = "GET", headers: Record<string, string> = {}, account = session) {
        const pending = handleBffRequest(new Request(`http://localhost/api/bff/notifications${path}`, { method, headers: { cookie: `access_token=${account.access}`, ...headers } }));
        await vi.runAllTimersAsync();
        return pending;
    }
    it("serves contract examples and filters before pagination", async () => {
        expect(mockNotifications).toEqual(example.items);
        const response = await call();
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.json()).toEqual(example);
        const filtered = await (await call("?isRead=false&pageSize=1&page=2")).json();
        expect(filtered.items[0].id).toBe(mockNotifications[1].id);
        expect(filtered.meta).toEqual({ page: 2, pageSize: 1, totalItems: 3, totalPages: 3 });
        expect((await (await call("?type=system")).json()).items).toHaveLength(1);
        for (const path of ["?isRead=bad", "?type=invalid", "?page=0", "?pageSize=101", "?unsupported=true"]) expect((await call(path)).status).toBe(422);
    });
    it("checks sessions and rejects missing CSRF and cross-site mutations", async () => {
        expect((await call("", "GET", { cookie: "" })).status).toBe(401);
        expect((await call("/read-all", "POST")).status).toBe(403);
        expect((await call("/read-all", "POST", { "x-csrf-token": session.csrf, origin: "https://evil.example" })).status).toBe(403);
        expect((await call("/read-all", "POST", { "x-csrf-token": session.csrf, "sec-fetch-site": "cross-site" })).status).toBe(403);
        expect((await (await call("/unread-count")).json()).count).toBe(3);
    });
    it("persists read mutations and isolates accounts", async () => {
        const second = issueSession(getAuthStore().accounts.get("recruiter@example.com")!.user);
        const headers = { "x-csrf-token": session.csrf };
        const read = await call(`/${mockNotifications[0].id}/read`, "PATCH", headers);
        expect(read.status).toBe(200);
        expect((await read.json()).isRead).toBe(true);
        expect((await (await call("/unread-count")).json()).count).toBe(2);
        expect((await (await call("/unread-count", "GET", {}, second)).json()).count).toBe(3);
        expect((await call("/read-all", "POST", headers)).status).toBe(204);
        expect((await (await call("?isRead=false")).json()).items).toEqual([]);
        expect((await (await call("/unread-count")).json()).count).toBe(0);
        expect((await call("/90000000-0000-4000-8000-999999999999/read", "PATCH", headers)).status).toBe(404);
    });
    it("supports empty, slow and failed requests without changing state", async () => {
        expect((await (await call("", "GET", { "x-mock-scenario": "empty" })).json()).items).toEqual([]);
        expect((await call("", "GET", { "x-mock-scenario": "slow" })).status).toBe(200);
        expect((await call("/read-all", "POST", { "x-csrf-token": session.csrf, "x-mock-scenario": "error" })).status).toBe(500);
        expect((await (await call("/unread-count")).json()).count).toBe(3);
    });
    it("keeps real private proxy closed until session integration is available", async () => {
        vi.stubEnv("DATA_MODE", "real"); vi.stubEnv("BACKEND_API_URL", "https://backend.example");
        expect((await call()).status).toBe(503);
    });
});
