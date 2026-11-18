import { afterEach, describe, expect, it, vi } from "vitest";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import { handleNotifications } from "@/server/bff/notifications/service";

const session = vi.hoisted(() => ({ role: "candidate", signedIn: true }));
vi.mock("@/server/bff/auth/session", () => ({
    readRequestIdentity: async () => session.signedIn ? {
        user: { id: "user-1", role: session.role, status: "active" },
        access: "test-access-token",
    } : null,
}));

const backendUrl = "http://localhost:3007/api/v1";
const notification = {
    id: "notification-1",
    type: "recruiter_new_application",
    subject: "Có ứng viên mới",
    body: "Một ứng viên vừa nộp hồ sơ.",
    metadata: { jobId: "job-1" },
    read: false,
    createdAt: "2026-11-18T08:00:00Z",
};

function request(path = "", method = "GET", csrf = "") {
    return new Request(`http://localhost/api/bff/notifications${path}`, {
        method,
        headers: { cookie: "access_token=test-access-token", ...(csrf ? { "x-csrf-token": csrf } : {}) },
    });
}

afterEach(() => {
    vi.restoreAllMocks();
    session.role = "candidate";
    session.signedIn = true;
});

describe("real notification BFF", () => {
    it("maps backend pagination, notification fields and bearer token", async () => {
        const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
            success: true,
            data: { items: [notification], totalItems: 21, totalPages: 3, currentPage: 1, unreadCount: 4 },
        }));
        session.role = "recruiter";
        const response = await handleNotifications(request("?page=2&pageSize=10&isRead=false"), backendUrl);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            items: [{ id: "notification-1", type: "recruiter_new_application", title: "Có ứng viên mới", body: "Một ứng viên vừa nộp hồ sơ.", data: { jobId: "job-1" }, isRead: false, createdAt: notification.createdAt }],
            meta: { page: 2, pageSize: 10, totalItems: 21, totalPages: 3 },
            unreadCount: 4,
        });
        expect(String(fetcher.mock.calls[0][0])).toBe(`${backendUrl}/notifications?page=1&size=10&unreadOnly=true`);
        expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer test-access-token");
    });

    it("maps unread count and both read actions", async () => {
        const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
            const path = String(input);
            if (path.endsWith("unread-count")) return Response.json({ success: true, data: { unreadCount: 3 } });
            if (path.endsWith("read-all")) return Response.json({ success: true, data: { markedCount: 3 } });
            return Response.json({ success: true, data: { ...notification, read: true } });
        });
        expect(await (await handleNotifications(request("/unread-count"), backendUrl)).json()).toEqual({ count: 3 });
        const csrf = csrfTokenFor({ access: "test-access-token" });
        expect((await (await handleNotifications(request("/notification-1/read", "PATCH", csrf), backendUrl)).json()).isRead).toBe(true);
        expect((await handleNotifications(request("/read-all", "POST", csrf), backendUrl)).status).toBe(204);
        expect(fetcher.mock.calls[2][1]?.method).toBe("PATCH");
    });

    it("rejects missing session and CSRF before calling the backend", async () => {
        const fetcher = vi.spyOn(globalThis, "fetch");
        session.signedIn = false;
        expect((await handleNotifications(request(), backendUrl)).status).toBe(401);
        session.signedIn = true;
        expect((await handleNotifications(request("/read-all", "POST"), backendUrl)).status).toBe(403);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it("does not log out a valid session when the notification service rejects its token", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
        const response = await handleNotifications(request(), backendUrl);
        expect(response.status).toBe(503);
    });
});
