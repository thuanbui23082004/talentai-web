import { afterEach, expect, test, vi } from "vitest";
import { handleAdminViolationReports } from "@/server/bff/admin/violation-reports-service";
import { csrfTokenFor } from "@/server/bff/auth/cookies";

const id = "a3b69c52-6bd7-4c30-b0b7-ae92312cc942";
const access = "admin-report-access";
const row = { id, reporterUserId: id, targetType: "JOB", targetId: id, targetTitle: "Backend Developer", reason: "FRAUD", description: "Đòi đóng tiền", evidenceUrl: null, status: "PENDING", adminNote: null, resolvedAt: null, createdAt: "2026-11-24T10:00:00Z", updatedAt: "2026-11-24T10:00:00Z" };
const base = "http://localhost:3000/api/v1";
function request(path = "", method = "GET", body?: unknown, csrf = csrfTokenFor({ access })) { return new Request(`http://localhost/api/bff/admin/violation-reports${path}`, { method, headers: { cookie: `access_token=${access}`, "X-CSRF-Token": csrf, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
afterEach(() => vi.restoreAllMocks());
test("admin reports forward filters, detail and status updates with a verified bearer", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        calls.push({ url: String(url), init });
        if (String(url).endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id, email: "admin@example.test", displayName: "Admin", status: "ACTIVE", roles: ["ADMIN"] } } });
        if (String(url).includes("?")) return Response.json({ code: 200, data: { content: [row], totalElements: 1, totalPages: 1, number: 0, size: 20 } });
        if (init?.method === "PATCH") return Response.json({ unexpected: true });
        return Response.json({ code: 200, data: row });
    });
    const list = await handleAdminViolationReports(request("?targetType=JOB&status=PENDING&page=1"), base);
    expect((await list.json()).meta.totalItems).toBe(1);
    expect(calls.some(call => call.url.endsWith("/admin/reports?targetType=JOB&status=PENDING&page=0&size=20"))).toBe(true);
    expect((await handleAdminViolationReports(request(`/${id}`), base)).status).toBe(200);
    expect((await handleAdminViolationReports(request(`/${id}`, "PATCH", { status: "RESOLVED" }, "bad"), base)).status).toBe(403);
    expect((await handleAdminViolationReports(request(`/${id}`, "PATCH", { status: "RESOLVED", adminNote: "Đã xử lý" }), base)).status).toBe(204);
    expect(calls.at(-1)?.init?.method).toBe("PATCH");
    expect(new Headers(calls.at(-1)?.init?.headers).get("Authorization")).toBe(`Bearer ${access}`);
});

test("non-admin users cannot read the admin report list", async () => {
    const network = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ success: true, data: { profile: { id, email: "candidate@example.test", displayName: "Candidate", status: "ACTIVE", roles: ["CANDIDATE"] } } }));
    expect((await handleAdminViolationReports(request(), base)).status).toBe(403);
    expect(network).toHaveBeenCalledTimes(1);
});
