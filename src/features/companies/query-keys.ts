import type { CompanyFilters } from "./types";
export const companyKeys = { list: (filters: CompanyFilters) => ["companies", "list", filters] as const };
