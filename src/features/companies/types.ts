import type { components, operations } from "@/lib/api/generated/schema";
export type Company = components["schemas"]["CompanyPublic"];
export type CompanyPage = components["schemas"]["CompanyPage"];
export type CompanyFilters = NonNullable<operations["searchCompanies"]["parameters"]["query"]>;
