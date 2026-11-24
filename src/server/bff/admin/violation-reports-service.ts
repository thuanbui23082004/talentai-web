import { z } from "zod";
import { readRequestIdentity } from "../auth/session";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { apiError } from "../responses";

const report = z.object({ id: z.uuid(), targetType: z.enum(["JOB", "COMPANY"]), targetId: z.string(), targetTitle: z.string().nullish(), reason: z.enum(["FRAUD", "SPAM", "FAKE_INFO", "SALARY_SCAM", "INAPPROPRIATE_CONTENT", "OTHER"]), description: z.string(), evidenceUrl: z.string().nullish(), status: z.enum(["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"]), createdAt: z.string(), updatedAt: z.string().nullish(), reporterUserId: z.string().nullish(), adminNote: z.string().nullish(), resolvedAt: z.string().nullish() });
const page = z.object({ content: z.array(report), totalElements: z.number(), totalPages: z.number(), number: z.number(), size: z.number() });
const envelope = z.object({ code: z.literal(200), data: z.unknown() });
const update = z.object({ status: z.enum(["INVESTIGATING", "RESOLVED", "DISMISSED"]), adminNote: z.string().max(2000).optional() });
const basePath = "/api/bff/admin/violation-reports";

export function isAdminViolationReportRequest(request: Request) {
    return new URL(request.url).pathname === basePath || /^\/api\/bff\/admin\/violation-reports\/[0-9a-f-]{36}$/i.test(new URL(request.url).pathname);
}

export async function handleAdminViolationReports(request: Request, baseUrl: string): Promise<Response> {
    const source = new URL(request.url);
    const id = source.pathname === basePath ? undefined : source.pathname.slice(basePath.length + 1);
    if ((id ? !["GET", "PATCH"].includes(request.method) : request.method !== "GET")) return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    if (request.method === "PATCH" && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (identity.user.role !== "admin") return apiError(403, "FORBIDDEN", "Chỉ quản trị viên được xem báo cáo.");
    const target = new URL(`${baseUrl.replace(/\/$/, "")}/admin/reports${id ? `/${id}` : ""}`);
    if (!id) {
        const targetType = source.searchParams.get("targetType");
        const status = source.searchParams.get("status");
        const pageNumber = Number(source.searchParams.get("page") ?? 1);
        const pageSize = Number(source.searchParams.get("pageSize") ?? 20);
        if ((targetType && !["JOB", "COMPANY"].includes(targetType)) || (status && !["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"].includes(status)) || !Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return apiError(422, "VALIDATION_FAILED", "Bộ lọc báo cáo không hợp lệ.");
        if (targetType) target.searchParams.set("targetType", targetType);
        if (status) target.searchParams.set("status", status);
        target.searchParams.set("page", String(pageNumber - 1)); target.searchParams.set("size", String(pageSize));
    }
    const parsed = request.method === "PATCH" ? update.safeParse(await request.json().catch(() => null)) : null;
    if (parsed && !parsed.success) return apiError(422, "VALIDATION_FAILED", "Thông tin xử lý báo cáo không hợp lệ.");
    try {
        const upstream = await fetch(target, { method: request.method, headers: { Authorization: `Bearer ${identity.access}`, Accept: "application/json", ...(parsed ? { "Content-Type": "application/json" } : {}) }, ...(parsed ? { body: JSON.stringify(parsed.data) } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
        if (!upstream.ok) return apiError(upstream.status === 401 ? 401 : upstream.status === 403 ? 403 : upstream.status === 404 ? 404 : upstream.status === 400 ? 422 : 503, upstream.status === 404 ? "NOT_FOUND" : "SERVICE_UNAVAILABLE", "Không thể xử lý báo cáo. Vui lòng thử lại.");
        // A successful PATCH is final even if the upstream response body changes.
        // The detail query reloads the persisted report after this acknowledgement.
        if (request.method === "PATCH") return new Response(null, { status: 204 });
        const data = envelope.parse(await upstream.json()).data;
        if (id) return Response.json(report.parse(data));
        const result = page.parse(data);
        return Response.json({ items: result.content, meta: { page: result.number + 1, pageSize: result.size, totalItems: result.totalElements, totalPages: result.totalPages } });
    } catch { return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải báo cáo. Vui lòng thử lại."); }
}
