import type { components } from "@/lib/api/generated/schema";
import { homeContent } from "@/mocks/fixtures/home";
import { handleBffRequest } from "./handler";

/** Server-page entry: public jobs use the same adapter/proxy as browser requests. */
export async function loadHomePage() {
    const response = await handleBffRequest(new Request("http://talentai.internal/api/bff/jobs?pageSize=6"));
    const initialJobs: components["schemas"]["JobSearchResponse"] | undefined = response.ok ? await response.json() : undefined;
    return { content: homeContent, initialJobs };
}
