import type { components } from "@/lib/api/generated/schema";

export function createMockSavedJobs(jobs: components["schemas"]["JobSummary"][]): components["schemas"]["SavedJob"][] {
    const items = jobs.slice(0, 8).map((job, index) => ({ job, savedAt: `2026-10-${String(21 - index).padStart(2, "0")}T07:30:00Z` }));
    return [...items, {
        job: { ...jobs[8], id: "10000000-0000-4000-8000-000000000090", title: "Chuyên viên kinh doanh · Đợt tuyển tháng 9", status: "closed", applicationDeadline: "2026-10-10" },
        savedAt: "2026-10-13T07:30:00Z",
    }];
}
