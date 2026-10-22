import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { createMockSavedJobs } from "@/mocks/fixtures/saved-jobs";
import { readAuthCookies } from "./cookies";
import { findUser, readSession } from "./mock-auth-store";
import { apiError } from "./responses";

type SavedJob = components["schemas"]["SavedJob"];
const initial = createMockSavedJobs(mockJobs);
const globals = globalThis as typeof globalThis & { __talentaiSavedJobs?: Map<string, SavedJob[]> };
export function resetMockSavedJobs() { delete globals.__talentaiSavedJobs; }

const pageSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export async function handleMockSavedJobs(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const base = "/api/bff/candidate/saved-jobs";
    if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return;
    const id = url.pathname.slice(base.length + 1);
    if (id && !z.uuid().safeParse(id).success) return apiError(404, "NOT_FOUND", "Không tìm thấy việc làm.");
    if ((!id && request.method !== "GET") || (id && !["PUT", "DELETE"].includes(request.method))) return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    const session = readSession(readAuthCookies(request.headers.get("cookie")).access, false);
    const user = session && findUser(session);
    if (!session || !user || user.status !== "active") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chỉ ứng viên được quản lý việc làm đã lưu.");
    if (request.method !== "GET") {
        let validOrigin = true;
        const origin = request.headers.get("origin");
        try { if (origin) { const source = new URL(origin); validOrigin = source.host === (request.headers.get("host") ?? url.host) && source.protocol === url.protocol; } } catch { validOrigin = false; }
        if (!validOrigin || request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-csrf-token") !== session.csrf) return apiError(403, "CSRF_TOKEN_INVALID", "Yêu cầu không hợp lệ.");
    }
    const scenario = request.headers.get("x-mock-scenario");
    await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
    if (scenario === "error") return apiError(500, "INTERNAL_ERROR", "Không thể cập nhật việc làm đã lưu.");
    if (scenario === "unauthorized") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (scenario === "forbidden") return apiError(403, "FORBIDDEN", "Không có quyền truy cập.");
    globals.__talentaiSavedJobs ??= new Map();
    if (!globals.__talentaiSavedJobs.has(user.id)) globals.__talentaiSavedJobs.set(user.id, structuredClone(initial));
    const items = globals.__talentaiSavedJobs.get(user.id)!;
    const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "no-store" } });
    if (request.method === "GET") {
        const parsed = pageSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Phân trang không hợp lệ.");
        const { page, pageSize } = parsed.data;
        const sorted = scenario === "empty" ? [] : items.toSorted((a, b) => b.savedAt.localeCompare(a.savedAt) || a.job.id.localeCompare(b.job.id));
        return json({ items: sorted.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: sorted.length, totalPages: Math.ceil(sorted.length / pageSize) } } satisfies components["schemas"]["SavedJobPage"]);
    }
    const index = items.findIndex((item) => item.job.id === id);
    if (request.method === "DELETE") {
        if (index < 0) return apiError(404, "NOT_FOUND", "Việc làm chưa được lưu.");
        items.splice(index, 1);
        return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }
    if (index >= 0) return json(items[index]);
    const job = mockJobs.find((item) => item.id === id) ?? initial.find((item) => item.job.id === id)?.job;
    if (!job) return apiError(404, "NOT_FOUND", "Không tìm thấy việc làm.");
    const entry: SavedJob = { job, savedAt: new Date().toISOString() };
    items.unshift(entry);
    return json(entry);
}
