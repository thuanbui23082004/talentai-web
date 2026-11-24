import { z } from "zod";
import { readRequestIdentity } from "../auth/session";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { apiError } from "../responses";

const reason = z.enum(["FRAUD", "SPAM", "FAKE_INFO", "SALARY_SCAM", "INAPPROPRIATE_CONTENT", "OTHER"]);
const input = z.object({ targetId: z.string().min(1), targetTitle: z.string().max(255).optional(), reason, description: z.string().trim().min(1).max(3000), evidenceUrl: z.url().max(2048).refine(value => ["http:", "https:"].includes(new URL(value).protocol)).optional() });
const report = z.object({ id: z.string(), targetType: z.enum(["JOB", "COMPANY"]), targetId: z.string(), targetTitle: z.string().nullish(), reason, description: z.string(), evidenceUrl: z.string().nullish(), status: z.enum(["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"]), createdAt: z.string(), updatedAt: z.string().nullish() });
const page = z.object({ content: z.array(report), totalElements: z.number(), totalPages: z.number(), number: z.number(), size: z.number() });
const envelope = z.object({ code: z.literal(200), data: z.unknown() });
const mockReports = new Map<string, z.infer<typeof report>[]>();

export function isViolationReportRequest(request: Request) {
    return /^\/api\/bff\/reports\/(my|jobs|companies)$/.test(new URL(request.url).pathname);
}

export async function handleViolationReports(request: Request, baseUrl?: string): Promise<Response> {
    const source = new URL(request.url);
    const kind = source.pathname.split("/").at(-1);
    if ((kind === "my" ? request.method !== "GET" : request.method !== "POST")) return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    if (request.method === "POST" && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    const pageNumber = Number(source.searchParams.get("page") ?? 1);
    const pageSize = Number(source.searchParams.get("pageSize") ?? 20);
    if (kind === "my" && (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)) return apiError(422, "VALIDATION_FAILED", "Phân trang không hợp lệ.");
    const parsed = request.method === "POST" ? input.safeParse(await request.json().catch(() => null)) : null;
    if (parsed && !parsed.success) return apiError(422, "VALIDATION_FAILED", "Vui lòng kiểm tra thông tin báo cáo.");
    if (!baseUrl) {
        const own = mockReports.get(identity.userId) ?? [];
        if (kind === "my") return Response.json({ items: own.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), meta: { page: pageNumber, pageSize, totalItems: own.length, totalPages: Math.ceil(own.length / pageSize) } });
        const value = report.parse({ ...parsed!.data, id: crypto.randomUUID(), targetType: kind === "jobs" ? "JOB" : "COMPANY", status: "PENDING", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        if (own.some(item => item.targetType === value.targetType && item.targetId === value.targetId && ["PENDING", "INVESTIGATING"].includes(item.status))) return apiError(409, "CONFLICT", "Bạn đã báo cáo mục này và báo cáo đang được xử lý.");
        mockReports.set(identity.userId, [value, ...own]);
        return new Response(null, { status: 204 });
    }
    const target = new URL(`${baseUrl.replace(/\/$/, "")}/reports/${kind}`);
    if (kind === "my") { target.searchParams.set("page", String(pageNumber - 1)); target.searchParams.set("size", String(pageSize)); }
    try {
        const upstream = await fetch(target, { method: request.method, headers: { Authorization: `Bearer ${identity.access}`, Accept: "application/json", ...(parsed ? { "Content-Type": "application/json" } : {}) }, ...(parsed ? { body: JSON.stringify(parsed.data) } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
        if (!upstream.ok) return apiError(upstream.status === 409 ? 409 : upstream.status === 401 ? 401 : upstream.status === 403 ? 403 : upstream.status === 400 ? 422 : 503, upstream.status === 409 ? "CONFLICT" : "SERVICE_UNAVAILABLE", upstream.status === 409 ? "Bạn đã báo cáo mục này và báo cáo đang được xử lý." : "Không thể xử lý báo cáo. Vui lòng thử lại.");
        // The upstream write has completed. Its response body is not needed by the
        // form; a schema mismatch here must not turn a persisted report into 503.
        if (kind !== "my") return new Response(null, { status: 204 });
        const body = envelope.parse(await upstream.json());
        const data = page.parse(body.data);
        return Response.json({ items: data.content, meta: { page: data.number + 1, pageSize: data.size, totalItems: data.totalElements, totalPages: data.totalPages } });
    } catch { return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải báo cáo. Vui lòng thử lại."); }
}
