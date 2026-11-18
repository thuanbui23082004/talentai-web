import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { apiError } from "../responses";

type Notification = components["schemas"]["Notification"];

const route = "/api/bff/notifications";
const notificationType = z.enum([
    "application_submitted", "application_status_changed", "application_withdrawn",
    "interview_invited", "interview_updated", "interview_cancelled",
    "interview_response", "interview_result", "job_recommended",
    "recruiter_new_application", "company_verification", "job_moderated",
    "payment_completed", "payment_failed", "subscription_expiring",
    "auth_otp_requested", "password_changed", "account_locked",
    "report_update", "system",
]);
const upstreamNotification = z.object({
    id: z.string().min(1),
    type: notificationType,
    subject: z.string(),
    body: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
    read: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
});
const upstreamList = z.object({
    success: z.literal(true),
    data: z.object({
        items: z.array(upstreamNotification),
        totalItems: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
        currentPage: z.number().int().nonnegative(),
        unreadCount: z.number().int().nonnegative(),
    }),
});
const upstreamCount = z.object({
    success: z.literal(true),
    data: z.object({ unreadCount: z.number().int().nonnegative() }),
});
const upstreamItem = z.object({ success: z.literal(true), data: upstreamNotification });
const upstreamReadAll = z.object({ success: z.literal(true) });
const filters = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    isRead: z.enum(["true", "false"]).optional(),
}).strict();

function mapNotification(item: z.infer<typeof upstreamNotification>): Notification {
    return {
        id: item.id,
        type: item.type,
        title: item.subject,
        body: item.body ?? undefined,
        data: item.metadata ?? undefined,
        isRead: item.read,
        createdAt: item.createdAt,
    };
}

function upstreamError(status: number) {
    // Auth service already validated this session. A 401 here means the
    // notification service rejected the same token (often JWT configuration).
    if (status === 401) return apiError(503, "SERVICE_UNAVAILABLE", "Dịch vụ thông báo chưa xác thực được phiên này.");
    if (status === 403) return apiError(403, "FORBIDDEN", "Bạn không có quyền xem thông báo.");
    if (status === 404) return apiError(404, "NOT_FOUND", "Không tìm thấy thông báo.");
    if (status === 400 || status === 422) return apiError(422, "VALIDATION_FAILED", "Yêu cầu thông báo không hợp lệ.");
    return apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ thông báo. Vui lòng thử lại.");
}

export function isNotificationRequest(request: Request) {
    const path = new URL(request.url).pathname;
    return path === route || path.startsWith(`${route}/`);
}

export async function handleNotifications(request: Request, baseUrl: string): Promise<Response> {
    const source = new URL(request.url);
    const path = source.pathname;
    const readId = /^\/api\/bff\/notifications\/([^/]+)\/read$/.exec(path)?.[1];
    const isList = path === route && request.method === "GET";
    const isCount = path === `${route}/unread-count` && request.method === "GET";
    const isRead = !!readId && request.method === "PATCH";
    const isReadAll = path === `${route}/read-all` && request.method === "POST";

    if (!isList && !isCount && !isRead && !isReadAll)
        return apiError(405, "BAD_REQUEST", "Phương thức hoặc đường dẫn không được hỗ trợ.");
    if (!isList && source.search)
        return apiError(422, "VALIDATION_FAILED", "Yêu cầu thông báo không hợp lệ.");
    const query = isList ? filters.safeParse(Object.fromEntries(source.searchParams)) : null;
    if (query && !query.success)
        return apiError(422, "VALIDATION_FAILED", "Bộ lọc thông báo không hợp lệ.");
    if (query?.success && query.data.isRead === "true")
        return apiError(422, "VALIDATION_FAILED", "Bộ lọc đã đọc chưa được hỗ trợ.");
    if ((isRead || isReadAll) && (!isTrustedOrigin(request) || !hasValidCsrf(request)))
        return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");

    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "candidate" && identity.user.role !== "recruiter")
            return apiError(403, "FORBIDDEN", "Bạn không có quyền xem thông báo.");

        const target = new URL(`${baseUrl.replace(/\/$/, "")}/notifications${path.slice(route.length)}`);
        if (query?.success) {
            target.searchParams.set("page", String(query.data.page - 1));
            target.searchParams.set("size", String(query.data.pageSize));
            if (query.data.isRead === "false") target.searchParams.set("unreadOnly", "true");
        }
        const method = isReadAll ? "PATCH" : request.method;
        const response = await fetch(target, {
            method,
            headers: { Accept: "application/json", Authorization: `Bearer ${identity.access}` },
            cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return upstreamError(response.status);
        const body: unknown = await response.json();
        const headers = { "Cache-Control": "private, no-store" };

        if (isCount) {
            const count = upstreamCount.parse(body).data.unreadCount;
            return Response.json({ count } satisfies components["schemas"]["CountResponse"], { headers });
        }
        if (isReadAll) {
            upstreamReadAll.parse(body);
            return new Response(null, { status: 204, headers });
        }
        if (isRead) {
            const item = upstreamItem.parse(body).data;
            if (item.id !== readId) throw new Error("Unexpected notification ID");
            return Response.json(mapNotification(item), { headers });
        }
        const page = upstreamList.parse(body).data;
        if (!query?.success || page.currentPage !== query.data.page - 1)
            throw new Error("Unexpected notification page");
        return Response.json({
            items: page.items.map(mapNotification),
            meta: {
                page: query.data.page, pageSize: query.data.pageSize,
                totalItems: page.totalItems, totalPages: page.totalPages,
            },
            unreadCount: page.unreadCount,
        } satisfies components["schemas"]["NotificationPage"], { headers });
    } catch {
        return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải thông báo. Vui lòng thử lại.");
    }
}
