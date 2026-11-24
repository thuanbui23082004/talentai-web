import { afterEach, describe, expect, it, vi } from "vitest";
import { handleViolationReports } from "@/server/bff/reports/service";
import { csrfTokenFor } from "@/server/bff/auth/cookies";

const userId = "90e59821-b616-446b-87ee-8233947071ee";
const jobId = "ad783432-e932-4678-bc41-61821e4924d1";
const access = "report-test-token";
function request(path: string, method = "GET", body?: unknown, csrf = csrfTokenFor({ access })) {
    return new Request(`http://localhost/api/bff/reports/${path}`, { method, headers: { cookie: `access_token=${access}`, "X-CSRF-Token": csrf, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
afterEach(() => vi.restoreAllMocks());
describe("violation reports", () => {
    it("keeps mock reports private, validates writes and lists submitted reports", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ success: true, data: { profile: { id: userId, email: "report@example.com", displayName: "Ứng viên", status: "ACTIVE", roles: ["CANDIDATE"] } } }));
        const body = { targetId: jobId, targetTitle: "Backend Developer", reason: "FRAUD", description: "Yêu cầu đóng tiền" };
        expect((await handleViolationReports(request("jobs", "POST", body, "bad"))).status).toBe(403);
        const created = await handleViolationReports(request("jobs", "POST", body));
        expect(created.status).toBe(204);
        expect(await created.text()).toBe("");
        expect((await handleViolationReports(request("jobs", "POST", body))).status).toBe(409);
        const list = await handleViolationReports(request("my?page=1&pageSize=20"));
        expect((await list.json()).items).toEqual([expect.objectContaining({ targetId: jobId })]);
    });
    it("maps the real service's zero-based page and acknowledges a successful write", async () => {
        const calls: string[] = [];
        vi.spyOn(globalThis, "fetch").mockImplementation(async url => {
            const path = String(url);
            calls.push(path);
            if (path.endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id: userId, email: "report@example.com", displayName: "Ứng viên", status: "ACTIVE", roles: ["CANDIDATE"] } } });
            if (path.includes("/reports/my")) return Response.json({ code: 200, data: { content: [], totalElements: 0, totalPages: 0, number: 1, size: 20 } });
            // A successful upstream write must not become a 503 because its body differs.
            return Response.json({ unexpected: true }, { status: 201 });
        });
        const base = "http://localhost:3001/api/v1";
        const list = await handleViolationReports(request("my?page=2"), base);
        expect((await list.json()).meta.page).toBe(2);
        expect(calls.some(path => path.endsWith("/reports/my?page=1&size=20"))).toBe(true);
        const created = await handleViolationReports(request("companies", "POST", { targetId: jobId, reason: "SPAM", description: "Spam" }), base);
        expect(created.status).toBe(204);
        expect(await created.text()).toBe("");
    });
});
