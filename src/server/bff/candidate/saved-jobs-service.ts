import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { jobSchema, summary } from "../public/job-service";
import { apiError } from "../responses";

const basePath = "/api/bff/candidate/saved-jobs";
const pagination = z.object({
    page: z.coerce.number().int().min(1).max(10001).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
const savedResult = z.object({ code: z.literal(200), data: z.object({ jobPostId: z.uuid(), saved: z.literal(true) }) });
const savedPage = z.object({
    code: z.literal(200), data: z.object({
        items: z.array(z.object({ job: jobSchema, savedAt: z.iso.datetime({ offset: true }) })),
        page: z.number().int().nonnegative(), size: z.number().int().positive(),
        totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
    }),
});
const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "private, no-store" } });

export function isSavedJobsRequest(request: Request) {
    const path = new URL(request.url).pathname;
    return path === basePath || path.startsWith(`${basePath}/`);
}

function upstreamError(status: number) {
    if (status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
    if (status === 403) return apiError(403, "FORBIDDEN", "Chỉ ứng viên được quản lý việc làm đã lưu.");
    if (status === 404) return apiError(404, "NOT_FOUND", "Không tìm thấy việc làm.");
    if ([400, 422].includes(status)) return apiError(422, "VALIDATION_FAILED", "Vui lòng kiểm tra yêu cầu lưu việc.");
    if (status === 429) return apiError(429, "RATE_LIMITED", "Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
    return apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ việc làm đã lưu.");
}

// Keep cookie/CSRF handling in the BFF; Java receives only the verified bearer token.
export async function handleSavedJobs(request: Request, baseUrl: string): Promise<Response> {
    const source = new URL(request.url);
    const jobId = source.pathname === basePath ? "" : source.pathname.slice(basePath.length + 1);
    if (jobId && !z.uuid().safeParse(jobId).success) return apiError(404, "NOT_FOUND", "Không tìm thấy việc làm.");
    if (!(jobId ? ["PUT", "DELETE"] : ["GET"]).includes(request.method)) return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    if (request.method !== "GET" && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");

    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chỉ ứng viên được quản lý việc làm đã lưu.");

        const target = new URL(`${baseUrl.replace(/\/$/, "")}/saved-jobs`);
        if (request.method === "GET") {
            const parsed = pagination.safeParse(Object.fromEntries(source.searchParams));
            if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Phân trang không hợp lệ.");
            target.searchParams.set("page", String(parsed.data.page - 1));
            target.searchParams.set("size", String(parsed.data.pageSize));
        } else if (request.method === "DELETE") target.searchParams.set("jobPostId", jobId);

        const init: RequestInit = {
            method: request.method === "PUT" ? "POST" : request.method,
            headers: { Accept: "application/json", Authorization: `Bearer ${identity.access}`, ...(request.method === "PUT" ? { "Content-Type": "application/json" } : {}) },
            ...(request.method === "PUT" ? { body: JSON.stringify({ jobPostId: jobId }) } : {}),
            cache: "no-store", redirect: "error",
        };
        // Never retry a save/removal. Only retry transient GET failures.
        let response: Response | undefined;
        for (let attempt = 0; attempt < (request.method === "GET" ? 3 : 1); attempt++) {
            try {
                response = await fetch(target, { ...init, signal: AbortSignal.timeout(5000) });
                if (response.status < 500) break;
            } catch {
                response = undefined;
            }
            if (request.method === "GET" && attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!response) return upstreamError(503);
        if (!response.ok) return upstreamError(response.status);
        if (request.method === "DELETE") return response.status === 204
            ? new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } })
            : upstreamError(503);
        if (request.method === "PUT") {
            const result = savedResult.parse(await response.json()).data;
            if (result.jobPostId !== jobId) return upstreamError(503);
            return json(result satisfies components["schemas"]["SavedJobResult"]);
        }
        const page = savedPage.parse(await response.json()).data;
        return json({
            items: page.items.map(item => ({ job: summary(item.job), savedAt: item.savedAt })),
            meta: { page: page.page + 1, pageSize: page.size, totalItems: page.totalElements, totalPages: page.totalPages },
        } satisfies components["schemas"]["SavedJobPage"]);
    } catch {
        return upstreamError(503);
    }
}
