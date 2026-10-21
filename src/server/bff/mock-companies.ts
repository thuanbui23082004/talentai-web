import { createMockCompanies } from "@/mocks/fixtures/companies";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { parseCompanySearch } from "@/lib/companies/search";
import { normalizeLocation } from "@/lib/locations/vietnam";
import type { components } from "@/lib/api/generated/schema";
import { apiError } from "./responses";
import { z } from "zod";

const companies = createMockCompanies(mockJobs);
export function getMockCompany(id: string, empty = false) {
    const company = empty ? undefined : companies.find((item) => item.id === id);
    if (!company) return apiError(404, "NOT_FOUND", "Không tìm thấy công ty.");
    const body: components["schemas"]["CompanyPublic"] = {
        ...company,
        description: [company.description,
            `Tại ${company.name}, chúng tôi tin rằng con người là nền tảng cho sự phát triển bền vững. Mỗi thành viên được khuyến khích chia sẻ ý tưởng, chủ động học hỏi và cùng nhau tạo ra những giá trị thiết thực cho khách hàng.`,
            "Đội ngũ làm việc trong môi trường cởi mở, đề cao tinh thần hợp tác và trách nhiệm. Các hoạt động đào tạo nội bộ, trao đổi chuyên môn giúp nhân viên phát triển kỹ năng và định hướng nghề nghiệp rõ ràng.",
            "Chúng tôi chào đón những ứng viên có tinh thần cầu tiến, sẵn sàng thử thách bản thân và mong muốn đóng góp lâu dài. Khám phá các vị trí đang tuyển bên dưới để tìm cơ hội phù hợp với bạn.",
        ].filter(Boolean).join("\n\n"),
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export function getMockCompanyJobs(id: string, params: URLSearchParams, empty = false) {
    if (!companies.some((company) => company.id === id)) return apiError(404, "NOT_FOUND", "Không tìm thấy công ty.");
    const parsed = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(6) }).safeParse(Object.fromEntries(params));
    if (!parsed.success || [...params.keys()].some((key) => !["page", "pageSize"].includes(key))) return apiError(422, "VALIDATION_FAILED", "Phân trang không hợp lệ.");
    const { page, pageSize } = parsed.data;
    const items = empty ? [] : mockJobs.filter((job) => job.company.id === id && job.status === "open");
    const body: components["schemas"]["JobSummaryPage"] = { items: items.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) } };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
export function searchMockCompanies(params: URLSearchParams, empty = false) {
    const supported = new Set(["q", "city", "industryId", "size", "isVerified", "hiringOnly", "page", "pageSize"]);
    const parsed = parseCompanySearch(params);
    if (!parsed.success || [...params.keys()].some((key) => !supported.has(key))) return apiError(422, "VALIDATION_FAILED", "Bộ lọc công ty không hợp lệ.");
    const { q, city, industryId, size, isVerified, hiringOnly, page, pageSize } = parsed.data;
    const matches = empty ? [] : companies.filter((company) => (!q || normalizeLocation(company.name).includes(normalizeLocation(q)))
        && (!city || normalizeLocation(company.city ?? "") === normalizeLocation(city))
        && (!industryId || company.industries?.some((item) => item.id === industryId))
        && (!size || company.size === size)
        && (isVerified === undefined || company.isVerified === isVerified)
        && (!hiringOnly || (company.openJobsCount ?? 0) > 0));
    const body: components["schemas"]["CompanyPage"] = { items: matches.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: matches.length, totalPages: Math.ceil(matches.length / pageSize) } };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
