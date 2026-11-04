import type { components } from "@/lib/api/generated/schema";
import { homeContent } from "@/mocks/fixtures/home";
import { handleBffRequest } from "../handler";

/** Server-page entry: public jobs use the same adapter/proxy as browser requests. */
export async function loadHomePage() {
    const [response, companies] = await Promise.all([
        handleBffRequest(new Request("http://talentai.internal/api/bff/jobs?pageSize=20")),
        handleBffRequest(new Request("http://talentai.internal/api/bff/companies?pageSize=8")),
    ]);
    const initialJobs: components["schemas"]["JobSearchResponse"] | undefined = response.ok ? await response.json() : undefined;
    const initialCompanies: components["schemas"]["CompanyPage"] | undefined = companies.ok ? await companies.json() : undefined;
    const content = { ...homeContent, statistics: { ...homeContent.statistics, companies: initialCompanies ? String(initialCompanies.meta.totalItems) : "—" } };
    return { content, initialJobs, initialCompanies };
}
