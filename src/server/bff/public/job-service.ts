import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { parseJobSearchParams } from "@/lib/jobs/validation";
import { apiError } from "../responses";

const experience = z.enum(["INTERN", "FRESHER", "JUNIOR", "MIDDLE", "SENIOR", "EXPERT"]);
const jobType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]);
const workMode = z.enum(["ONSITE", "HYBRID", "REMOTE"]);
export const jobSchema = z.object({
    jobPostId: z.uuid(), companyId: z.uuid(), title: z.string(), location: z.string(),
    salaryMin: z.number().nonnegative().nullish(), salaryMax: z.number().nonnegative().nullish(), salaryCurrency: z.string().regex(/^[A-Z]{3}$/).nullish(), isSalaryNegotiable: z.boolean(),
    experienceLevel: experience, jobType, workMode,
    deadline: z.string().nullish(), publishedAt: z.string().nullish(),
});
const pageSchema = z.object({ items: z.array(jobSchema), page: z.number().int().nonnegative(), size: z.number().int().positive(), totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() });
const categoriesSchema = z.array(z.object({ categoryId: z.number().int().positive(), categoryName: z.string() }));
const detailSchema = jobSchema.extend({ description: z.string().nullish(), requirements: z.string().nullish(), benefits: z.string().nullish(), headCount: z.number().int().nullish(), skills: z.array(z.object({ skillName: z.string() })).nullish() });
const SORT = { newest: "publishedAt,desc", salary_desc: "salaryMax,desc", salary_asc: "salaryMin,asc", deadline: "deadline,asc" } as const;

export function summary(job: z.infer<typeof jobSchema>): components["schemas"]["JobSummary"] {
    return {
        id: job.jobPostId, title: job.title,
        // Job API only returns companyId. Do not invent a company name or call another service per card.
        company: { id: job.companyId, name: "Tên chưa cập nhật" },
        location: { city: job.location },
        salary: job.salaryCurrency ? { min: job.salaryMin ?? undefined, max: job.salaryMax ?? undefined, currency: job.salaryCurrency, negotiable: job.isSalaryNegotiable } : undefined,
        experienceLevel: job.experienceLevel, jobType: job.jobType, workMode: job.workMode,
        level: job.experienceLevel === "EXPERT" ? "senior" : job.experienceLevel.toLowerCase() as components["schemas"]["JobLevel"],
        workType: job.jobType.toLowerCase() as components["schemas"]["WorkType"],
        status: "open", postedAt: job.publishedAt ?? undefined, applicationDeadline: job.deadline?.slice(0, 10),
    };
}

export function isPublicJobRequest(request: Request) {
    return /^\/api\/bff\/jobs(?:\/(?:categories|[0-9a-f-]{36}))?$/i.test(new URL(request.url).pathname);
}

export async function handleJobService(request: Request, baseUrl: string): Promise<Response> {
    if (request.method !== "GET") return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    const source = new URL(request.url);
    const path = source.pathname.replace("/api/bff/", "");
    let targetPath = path === "jobs/categories" ? "job-categories" : path;
    const query = new URLSearchParams();
    if (path === "jobs") {
        const parsed = parseJobSearchParams(source.searchParams);
        const allowed = new Set(["q", "city", "categoryId", "companyId", "salaryMin", "salaryMax", "salaryCurrency", "isSalaryNegotiable", "experienceLevel", "jobType", "workMode", "sort", "page", "pageSize"]);
        if (!parsed.success || [...source.searchParams.keys()].some(key => !allowed.has(key))) return apiError(422, "VALIDATION_FAILED", "Bộ lọc không hợp lệ hoặc chưa được job-posting hỗ trợ.");
        const filters = parsed.data;
        if (!Object.hasOwn(SORT, filters.sort)) return apiError(422, "VALIDATION_FAILED", "Cách sắp xếp chưa được hỗ trợ.");
        query.set("page", String(filters.page - 1)); query.set("size", String(filters.pageSize));
        query.set("sort", SORT[filters.sort as keyof typeof SORT]);
        if (filters.q) query.set("keyword", filters.q);
        if (filters.city) query.set("location", filters.city);
        for (const key of ["categoryId", "companyId", "salaryMin", "salaryMax", "salaryCurrency", "isSalaryNegotiable", "experienceLevel", "jobType", "workMode"] as const) {
            if (filters[key] !== undefined) query.set(key, String(filters[key]));
        }
        targetPath = "jobs";
    }
    const target = new URL(`${baseUrl.replace(/\/$/, "")}/${targetPath}`);
    target.search = query.toString();
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const upstream = await fetch(target, { headers: { Accept: "application/json" }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000) });
            if (upstream.status >= 500 && attempt < 2) { await new Promise(resolve => setTimeout(resolve, 250)); continue; }
            if (!upstream.ok) {
                if (upstream.status === 404) return apiError(404, "NOT_FOUND", "Tin tuyển dụng không tồn tại hoặc đã đóng.");
                if (upstream.status === 400 || upstream.status === 422) return apiError(422, "VALIDATION_FAILED", "Vui lòng kiểm tra điều kiện tìm kiếm.");
                return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải việc làm. Vui lòng thử lại.");
            }
            const body = z.object({ code: z.literal(200), data: z.unknown() }).parse(await upstream.json());
            let result: unknown;
            if (path === "jobs/categories") result = categoriesSchema.parse(body.data);
            else if (path === "jobs") {
                const page = pageSchema.parse(body.data);
                result = { items: page.items.map(summary), meta: { page: page.page + 1, pageSize: page.size, totalItems: page.totalElements, totalPages: page.totalPages } } satisfies components["schemas"]["JobSearchResponse"];
            } else {
                const job = detailSchema.parse(body.data);
                result = { ...summary(job), description: job.description ?? "", requirements: job.requirements ?? "", benefits: job.benefits ?? undefined, headcount: job.headCount ?? undefined, skills: job.skills?.map(skill => skill.skillName) } satisfies components["schemas"]["JobDetail"];
            }
            return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
            if (error instanceof z.ZodError || error instanceof SyntaxError || attempt === 2) break;
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }
    return apiError(503, "SERVICE_UNAVAILABLE", "Dịch vụ việc làm chưa sẵn sàng. Vui lòng thử lại.");
}
