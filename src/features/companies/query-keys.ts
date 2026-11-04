import type { CompanyFilters } from "./types";
export const companyKeys = {
    catalogs: ["companies", "catalogs"] as const,
    featured: ["companies", "featured"] as const,
    list: (filters: CompanyFilters) => ["companies", "list", filters] as const,
    jobs: (id: string, page: number) =>
        ["companies", id, "jobs", page] as const,
};
