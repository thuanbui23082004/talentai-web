import { createMockCompanies } from "@/mocks/fixtures/companies";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { parseCompanySearch } from "@/lib/companies/search";
import { normalizeLocation } from "@/lib/locations/vietnam";
import type { components } from "@/lib/api/generated/schema";
import { apiError } from "./responses";

const companies = createMockCompanies(mockJobs);
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
