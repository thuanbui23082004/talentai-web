import { cache } from "react";
import type { components } from "@/lib/api/generated/schema";
import { handleBffRequest } from "./handler";

export const loadJobDetail = cache(async (jobId: string) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) return null;
    const response = await handleBffRequest(new Request(`http://talentai.internal/api/bff/jobs/${encodeURIComponent(jobId)}`));
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Không thể tải thông tin công việc. Vui lòng thử lại.");
    return await response.json() as components["schemas"]["JobDetail"];
});

export async function loadRelatedJobs(job: components["schemas"]["JobDetail"]) {
    const query = new URLSearchParams({ city: job.location.city, pageSize: "7" });
    const response = await handleBffRequest(new Request(`http://talentai.internal/api/bff/jobs?${query}`));
    if (!response.ok) return [];
    const result: components["schemas"]["JobSearchResponse"] = await response.json();
    return result.items.filter((item) => item.id !== job.id).slice(0, 6);
}
