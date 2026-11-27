import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { jobApplicantStatuses } from "@/lib/api/job-applicant-schemas";
import { createMockApplications } from "@/mocks/fixtures/applications";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { readRequestIdentity } from "../auth/session";
import { apiError } from "../responses";
import { loadPublicCompanies } from "../public/company-lookup";
import { getSubmittedMockApplications } from "./mock-application-submission";

type Tracking = components["schemas"]["CandidateApplicationTracking"];
type History = components["schemas"]["CandidateApplicationTrackingHistory"];

const route = "/api/bff/candidate/application-tracking";
const statusSchema = z.enum(jobApplicantStatuses);
const querySchema = z.object({
    status: statusSchema.optional(),
    page: z.coerce.number().int().min(1).max(10001).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(6),
}).strict();
const upstreamApplication = z.object({
    id: z.uuid(), jobId: z.uuid(), resumeId: z.uuid(),
    companyId: z.uuid().nullish(),
    status: statusSchema, version: z.number().int().nonnegative(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }).nullish(),
    resumeFileName: z.string().nullish(), coverLetter: z.string().nullish(),
    jobSnapshot: z.object({ title: z.string().nullish(), companyId: z.uuid().nullish(), companyName: z.string().nullish(), companyLogoUrl: z.url().nullish() }).nullish(),
});
const upstreamPage = z.object({
    success: z.literal(true),
    data: z.object({
        items: upstreamApplication.array(),
        page: z.number().int().nonnegative(), size: z.number().int().min(1).max(100),
        totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
    }),
});
const upstreamDetail = z.object({ success: z.literal(true), data: upstreamApplication });
const upstreamHistory = z.object({
    success: z.literal(true),
    data: z.array(z.object({
        newStatus: statusSchema, previousStatus: statusSchema.nullish(),
        createdAt: z.iso.datetime({ offset: true }), applicationVersion: z.number().int().nonnegative(),
        note: z.string().nullish(),
    })),
});

function mapApplication(item: z.infer<typeof upstreamApplication>): Tracking {
    return {
        id: item.id,
        jobId: item.jobId,
        resumeId: item.resumeId,
        status: item.status,
        version: item.version,
        appliedAt: item.createdAt,
        updatedAt: item.updatedAt ?? item.createdAt,
        jobTitle: item.jobSnapshot?.title ?? undefined,
        companyName: item.jobSnapshot?.companyName ?? undefined,
        companyLogoUrl: item.jobSnapshot?.companyLogoUrl ?? undefined,
        resumeFileName: item.resumeFileName ?? undefined,
        coverLetter: item.coverLetter ?? undefined,
    };
}

async function mapApplicationsWithCompanies(items: z.infer<typeof upstreamApplication>[], companyBaseUrl?: string): Promise<Tracking[]> {
    const mapped = items.map(mapApplication);
    if (!companyBaseUrl) return mapped;
    const companyIdFor = (item: z.infer<typeof upstreamApplication>) => item.companyId ?? item.jobSnapshot?.companyId;
    const companies = await loadPublicCompanies(items.flatMap(item => {
        const companyId = companyIdFor(item);
        return companyId ? [companyId] : [];
    }), companyBaseUrl);
    return mapped.map((item, index) => {
        const companyId = companyIdFor(items[index]);
        const company = companyId ? companies.get(companyId) : undefined;
        return company ? { ...item, companyName: company.name, companyLogoUrl: company.logoUrl ?? item.companyLogoUrl } : item;
    });
}

function errorResponse(status: number): Response {
    if (status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
    if (status === 403) return apiError(403, "FORBIDDEN", "Chỉ ứng viên được xem hồ sơ của mình.");
    if (status === 404) return apiError(404, "NOT_FOUND", "Không tìm thấy hồ sơ ứng tuyển.");
    if (status === 400 || status === 422) return apiError(422, "VALIDATION_FAILED", "Thông tin tìm kiếm không hợp lệ.");
    return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải hồ sơ ứng tuyển. Vui lòng thử lại.");
}

function mockResponse(userId: string, kind: "list" | "detail" | "history", id: string | undefined, query: z.infer<typeof querySchema>, scenario: string | null): Response {
    if (scenario === "error") return errorResponse(503);
    const submitted = getSubmittedMockApplications(userId);
    const entries = [...submitted, ...createMockApplications(mockJobs).filter(item => !submitted.some(saved => saved.jobId === item.jobId))];
    const items = entries.map(item => ({
        tracking: {
            id: item.id,
            jobId: item.jobId,
            resumeId: item.cvId,
            jobTitle: item.job.title,
            companyName: item.job.company.name,
            companyLogoUrl: item.job.company.logoUrl,
            resumeFileName: item.cvTitle,
            status: item.status === "interview" ? "interview_scheduled" : item.status,
            appliedAt: item.appliedAt,
            updatedAt: item.updatedAt,
            version: 0,
            coverLetter: item.coverLetter,
        } satisfies Tracking,
        history: item.statusHistory,
    }));
    if (kind !== "list") {
        const item = items.find(entry => entry.tracking.id === id);
        if (!item) return errorResponse(404);
        if (kind === "detail") {
            return Response.json(item.tracking, { headers: { "Cache-Control": "private, no-store" } });
        }
        const history: History[] = item.history?.map((entry, index) => ({
            status: entry.status === "interview" ? "interview_scheduled" : entry.status,
            changedAt: entry.changedAt, version: index, ...(entry.note ? { note: entry.note } : {}),
        })) ?? [{ status: item.tracking.status, changedAt: item.tracking.updatedAt, version: 0 }];
        return Response.json(history, { headers: { "Cache-Control": "private, no-store" } });
    }
    const filtered = (scenario === "empty" ? [] : items)
        .map(item => item.tracking)
        .filter(item => !query.status || item.status === query.status)
        .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    const start = (query.page - 1) * query.pageSize;
    return Response.json({
        items: filtered.slice(start, start + query.pageSize),
        meta: { page: query.page, pageSize: query.pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / query.pageSize) },
    } satisfies components["schemas"]["CandidateApplicationTrackingPage"], { headers: { "Cache-Control": "private, no-store" } });
}

export function isCandidateApplicationTrackingRequest(request: Request): boolean {
    const path = new URL(request.url).pathname;
    return path === route || path.startsWith(`${route}/`);
}

export async function handleCandidateApplicationTracking(request: Request, baseUrl?: string, companyBaseUrl?: string): Promise<Response> {
    if (request.method !== "GET") return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    const url = new URL(request.url);
    const suffix = url.pathname.slice(route.length);
    const match = /^\/([0-9a-f-]{36})(\/history)?$/i.exec(suffix);
    if (suffix && (!match || !z.uuid().safeParse(match[1]).success)) return errorResponse(404);
    let kind: "list" | "detail" | "history" = "list";
    if (match) kind = match[2] ? "history" : "detail";
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success || (kind !== "list" && url.search)) return errorResponse(422);

    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "candidate") return errorResponse(403);
        if (!baseUrl) {
            const scenario = request.headers.get("x-mock-scenario");
            await new Promise(resolve => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
            if (scenario === "unauthorized") return errorResponse(401);
            if (scenario === "forbidden") return errorResponse(403);
            return mockResponse(identity.userId, kind, match?.[1], parsed.data, scenario);
        }

        const target = new URL(`${baseUrl.replace(/\/$/, "")}/applications${suffix}`);
        if (kind === "list") {
            target.searchParams.set("page", String(parsed.data.page - 1));
            target.searchParams.set("size", String(parsed.data.pageSize));
            if (parsed.data.status) target.searchParams.set("status", parsed.data.status);
        }
        let response: Response | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await fetch(target, {
                    headers: { Accept: "application/json", Authorization: `Bearer ${identity.access}` },
                    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
                });
            } catch {
                response = undefined;
            }
            if (response && response.status < 500) break;
            if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!response?.ok) return errorResponse(response?.status ?? 503);
        const body: unknown = await response.json();
        const headers = { "Cache-Control": "private, no-store" };
        if (kind === "detail") {
            const item = upstreamDetail.parse(body).data;
            if (item.id !== match?.[1]) return errorResponse(503);
            const [tracking] = await mapApplicationsWithCompanies([item], companyBaseUrl);
            return Response.json(tracking, { headers });
        }
        if (kind === "history") {
            const history: History[] = upstreamHistory.parse(body).data.map(entry => ({
                status: entry.newStatus, changedAt: entry.createdAt, version: entry.applicationVersion,
                ...(entry.previousStatus ? { previousStatus: entry.previousStatus } : {}),
                ...(entry.note ? { note: entry.note } : {}),
            }));
            return Response.json(history, { headers });
        }
        const page = upstreamPage.parse(body).data;
        if (page.page !== parsed.data.page - 1 || page.size !== parsed.data.pageSize) return errorResponse(503);
        return Response.json({
            items: await mapApplicationsWithCompanies(page.items, companyBaseUrl),
            meta: { page: page.page + 1, pageSize: page.size, totalItems: page.totalElements, totalPages: page.totalPages },
        } satisfies components["schemas"]["CandidateApplicationTrackingPage"], { headers });
    } catch {
        return errorResponse(503);
    }
}
