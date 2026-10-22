import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { SavedJob } from "../types";

export async function getSavedJobs(signal?: AbortSignal): Promise<SavedJob[]> {
    const items: SavedJob[] = [];
    // Contract currently supports pagination only. Load every page before local filtering.
    for (let page = 1; ; page++) {
        const { data, error, response } = await apiClient.GET("/candidate/saved-jobs", { params: { query: { page, pageSize: 100 } }, signal });
        if (!data || error) throw toApiError(response.status, error);
        items.push(...data.items);
        if (page >= data.meta.totalPages) return items;
    }
}

export async function changeSavedJob({ jobId, saved }: { jobId: string; saved: boolean }) {
    const csrf = await apiClient.GET("/auth/csrf");
    if (!csrf.data || csrf.error) throw toApiError(csrf.response.status, csrf.error);
    const options = { params: { path: { jobId } }, headers: { "X-CSRF-Token": csrf.data.csrfToken } };
    if (saved) {
        const { data, error, response } = await apiClient.PUT("/candidate/saved-jobs/{jobId}", options);
        if (!data || error) throw toApiError(response.status, error);
        return data;
    }
    const { error, response } = await apiClient.DELETE("/candidate/saved-jobs/{jobId}", options);
    if (!response.ok) throw toApiError(response.status, error);
    return null;
}
