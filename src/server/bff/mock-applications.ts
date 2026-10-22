import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { createMockApplications, createMockApplicationInterviews } from "@/mocks/fixtures/applications";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { readAuthCookies } from "./cookies";
import { findUser, readSession } from "./mock-auth-store";
import { apiError } from "./responses";

const mockApplications = createMockApplications(mockJobs);
const mockApplicationInterviews = createMockApplicationInterviews(mockApplications);

const filtersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().optional(), sort: z.enum(["newest", "oldest"]).default("newest"),
    status: z.array(z.enum(["submitted", "reviewing", "interview", "hired", "rejected", "withdrawn"])).optional(),
}).strict();
const interviewFilters = z.object({
    page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
    invitationStatus: z.enum(["draft", "pending", "accepted", "declined"]).optional(),
    upcoming: z.enum(["true", "false"]).optional(), from: z.iso.date().optional(), to: z.iso.date().optional(),
}).strict();
const globals = globalThis as typeof globalThis & { __talentaiApplicationInterviews?: Map<string, components["schemas"]["Interview"][]> };
export function resetMockApplications() { delete globals.__talentaiApplicationInterviews; }

export async function handleMockApplications(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const respondId = url.pathname.match(/^\/api\/bff\/candidate\/interviews\/([0-9a-f-]{36})\/respond$/i)?.[1];
    const interviews = url.pathname === "/api/bff/candidate/interviews";
    if (!respondId && !interviews && url.pathname !== "/api/bff/applications") return;
    if (request.method !== (respondId ? "POST" : "GET")) return;
    const session = readSession(readAuthCookies(request.headers.get("cookie")).access, false);
    const user = session && findUser(session);
    if (!user || user.status !== "active") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chỉ ứng viên được xem hồ sơ ứng tuyển.");
    if (respondId) {
        const origin = request.headers.get("origin");
        let validOrigin = true;
        try { if (origin) { const source = new URL(origin); validOrigin = source.host === (request.headers.get("host") ?? url.host) && source.protocol === url.protocol; } } catch { validOrigin = false; }
        if (!validOrigin || request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-csrf-token") !== session!.csrf) return apiError(403, "CSRF_TOKEN_INVALID", "Yêu cầu không hợp lệ.");
    }
    const scenario = request.headers.get("x-mock-scenario");
    await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
    if (scenario === "error") return apiError(500, "INTERNAL_ERROR", "Không thể tải hồ sơ ứng tuyển.");
    if (scenario === "unauthorized") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (scenario === "forbidden") return apiError(403, "FORBIDDEN", "Không có quyền truy cập.");
    const query = Object.fromEntries(url.searchParams);
    const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "no-store" } });
    globals.__talentaiApplicationInterviews ??= new Map();
    if (!globals.__talentaiApplicationInterviews.has(user.id)) globals.__talentaiApplicationInterviews.set(user.id, structuredClone(mockApplicationInterviews));
    const userInterviews = globals.__talentaiApplicationInterviews.get(user.id)!;
    if (respondId) {
        const item = userInterviews.find((entry) => entry.id === respondId);
        if (!item) return apiError(404, "NOT_FOUND", "Không tìm thấy lời mời.");
        if (item.status !== "scheduled") return apiError(409, "CONFLICT", "Lịch phỏng vấn không còn hiệu lực.");
        if (item.invitationStatus !== "pending") return apiError(409, "INTERVIEW_ALREADY_RESPONDED", "Lời mời đã được phản hồi.");
        const body = await request.json().catch(() => null);
        const parsed = z.object({ response: z.enum(["accepted", "declined"]), reason: z.string().max(500).optional() }).strict().safeParse(body);
        if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Phản hồi không hợp lệ.");
        item.invitationStatus = parsed.data.response;
        if (parsed.data.reason) item.declineReason = parsed.data.reason;
        return json(item);
    }
    const meta = (page: number, pageSize: number, totalItems: number) => ({ page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) });
    if (interviews) {
        const parsed = interviewFilters.safeParse(query);
        if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Bộ lọc không hợp lệ.");
        const { page, pageSize, invitationStatus, upcoming, from, to } = parsed.data;
        const items = scenario === "empty" ? [] : userInterviews.filter((item) =>
            (!invitationStatus || item.invitationStatus === invitationStatus) &&
            (upcoming !== "true" || (item.status === "scheduled" && Date.parse(item.startTime) >= Date.now())) &&
            (!from || item.startTime.slice(0, 10) >= from) && (!to || item.startTime.slice(0, 10) <= to));
        return json({ items: items.slice((page - 1) * pageSize, page * pageSize), meta: meta(page, pageSize, items.length) } satisfies components["schemas"]["InterviewPage"]);
    }
    // openapi-fetch serializes arrays as repeated keys by default; also accept comma-separated values.
    const statuses = [...url.searchParams.getAll("status"), ...url.searchParams.getAll("status[]")].flatMap((value) => value.split(","));
    delete query["status[]"];
    const parsed = filtersSchema.safeParse({ ...query, ...(statuses.length ? { status: statuses } : {}) });
    if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Bộ lọc không hợp lệ.");
    const { page, pageSize, status, sort, q } = parsed.data;
    const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    const items = (scenario === "empty" ? [] : mockApplications).filter((item) => (!status || status.includes(item.status)) && (!q || normalize(`${item.job.title} ${item.job.company.name}`).includes(normalize(q))))
        .toSorted((a, b) => (sort === "oldest" ? 1 : -1) * a.appliedAt.localeCompare(b.appliedAt));
    return json({ items: items.slice((page - 1) * pageSize, page * pageSize), meta: meta(page, pageSize, items.length) } satisfies components["schemas"]["ApplicationPage"]);
}
