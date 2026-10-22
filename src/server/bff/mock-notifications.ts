import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { mockNotifications } from "@/mocks/fixtures/notifications";
import { readAuthCookies } from "./cookies";
import { findUser, readSession } from "./mock-auth-store";
import { apiError } from "./responses";

type Notification = components["schemas"]["Notification"];
const globals = globalThis as typeof globalThis & { __talentaiNotifications?: Map<string, Notification[]> };
export function resetMockNotifications() { delete globals.__talentaiNotifications; }

const filtersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    isRead: z.enum(["true", "false"]).optional(),
    type: z.enum(["application_submitted", "application_status_changed", "application_withdrawn", "interview_invited", "interview_updated", "interview_cancelled", "interview_response", "interview_result", "job_recommended", "job_moderated", "company_verification", "account_locked", "report_update", "ai_task_completed", "system"]).optional(),
}).strict();

export async function handleMockNotifications(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/bff", "");
    if (path !== "/notifications" && !path.startsWith("/notifications/")) return undefined;
    const session = readSession(readAuthCookies(request.headers.get("cookie")).access, false);
    const user = session && findUser(session);
    if (!session || !user || user.status !== "active") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    const readId = path.match(/^\/notifications\/([0-9a-f-]{36})\/read$/i)?.[1];
    const method = path === "/notifications/read-all" ? "POST" : readId ? "PATCH" : "GET";
    if (request.method !== method) return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    if (method !== "GET") {
        let sameOrigin = true;
        const origin = request.headers.get("origin");
        if (origin) {
            try { const source = new URL(origin); sameOrigin = source.host === (request.headers.get("host") ?? url.host) && source.protocol === url.protocol; }
            catch { sameOrigin = false; }
        }
        if (!sameOrigin || request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-csrf-token") !== session.csrf) return apiError(403, "CSRF_TOKEN_INVALID", "Yêu cầu không hợp lệ.");
    }
    const scenario = request.headers.get("x-mock-scenario");
    await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
    if (scenario === "error") return apiError(500, "INTERNAL_ERROR", "Không thể tải thông báo.");
    if (scenario === "unauthorized") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (scenario === "forbidden") return apiError(403, "FORBIDDEN", "Không có quyền truy cập.");
    globals.__talentaiNotifications ??= new Map();
    if (!globals.__talentaiNotifications.has(user.id)) globals.__talentaiNotifications.set(user.id, structuredClone(mockNotifications));
    const items = globals.__talentaiNotifications.get(user.id)!;
    const unreadCount = items.filter((item) => !item.isRead).length;
    const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "no-store" } });
    if (path === "/notifications/unread-count") return json({ count: scenario === "empty" ? 0 : unreadCount } satisfies components["schemas"]["CountResponse"]);
    if (path === "/notifications/read-all") {
        items.forEach((item) => { item.isRead = true; });
        return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }
    if (readId) {
        const item = items.find((entry) => entry.id === readId);
        if (!item) return apiError(404, "NOT_FOUND", "Không tìm thấy thông báo.");
        item.isRead = true;
        return json(item);
    }
    if (path !== "/notifications") return apiError(404, "NOT_FOUND", "Không tìm thấy thông báo.");
    const parsed = filtersSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Bộ lọc không hợp lệ.");
    const { page, pageSize, isRead, type } = parsed.data;
    const filtered = scenario === "empty" ? [] : items.filter((item) => (isRead === undefined || item.isRead === (isRead === "true")) && (!type || item.type === type));
    return json({ items: filtered.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / pageSize) }, unreadCount: scenario === "empty" ? 0 : unreadCount } satisfies components["schemas"]["NotificationPage"]);
}
