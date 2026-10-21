import { parseJobSearchParams } from "@/lib/jobs/validation";
import type { components } from "@/lib/api/generated/schema";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { apiError } from "./responses";

const supported = new Set(["q", "city", "provinceCode", "wardCode", "page", "pageSize", "sort", "salaryMin", "salaryMax", "minExperience", "maxExperience", "level", "workType"]);

export function searchMockJobs(params: URLSearchParams, empty = false): Response {
  // Explicitly reject filters not implemented yet instead of silently ignoring them.
  if ([...params.keys()].some((key) => !supported.has(key))) {
    return apiError(422, "VALIDATION_FAILED", "Bộ lọc này chưa được hỗ trợ trong mock hiện tại.");
  }
  const parsed = parseJobSearchParams(params);
  if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Bộ lọc hoặc phân trang không hợp lệ.");
  const { q, city, provinceCode, wardCode, page, pageSize, sort, salaryMin, salaryMax, minExperience, maxExperience, level, workType } = parsed.data;
  if (sort === "match_score") return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập để sử dụng tính năng này.");
  const normalize = (text: string) => text.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const items = empty ? [] : mockJobs.filter((job) => job.status === "open"
    && (!q || normalize([job.title, job.company.name, ...(job.skills ?? [])].join(" ")).includes(normalize(q)))
    && (!city || normalize(job.location.city).includes(normalize(city)))
    && (!provinceCode || job.location.provinceCode === provinceCode)
    && (!wardCode || job.location.wardCode === wardCode)
    && (salaryMin === undefined || (job.salary?.max ?? -1) >= salaryMin)
    && (salaryMax === undefined || (job.salary?.min ?? Infinity) <= salaryMax)
    && (minExperience === undefined || job.minExperienceYears >= minExperience)
    && (maxExperience === undefined || job.minExperienceYears <= maxExperience)
    && (!level?.length || level.includes(job.level))
    && (!workType?.length || workType.includes(job.workType)));
  items.sort((a, b) => {
    if (sort === "salary_asc") return (a.salary?.min ?? 0) - (b.salary?.min ?? 0);
    if (sort === "salary_desc") return (b.salary?.max ?? 0) - (a.salary?.max ?? 0);
    if (sort === "deadline") return (a.applicationDeadline ?? "").localeCompare(b.applicationDeadline ?? "");
    return (b.postedAt ?? "").localeCompare(a.postedAt ?? "");
  });
  const body: components["schemas"]["JobSearchResponse"] = {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) },
    appliedFilters: parsed.data,
    suggestions: items.length ? [] : ["Thử từ khóa khác hoặc mở rộng địa điểm tìm kiếm."],
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
