import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { ApplicationFilters } from "../types";

export async function getApplications(filters: ApplicationFilters, signal?: AbortSignal) {
    const { data, error, response } = await apiClient.GET("/applications", { params: { query: filters }, signal });
    if (!data || error) throw toApiError(response.status, error);
    return data;
}

export async function getInterviews(signal?: AbortSignal) {
    // Follow all pages so interviews on later pages are never mistaken for missing schedules.
    const items = [];
    for (let page = 1; ; page++) {
        const { data, error, response } = await apiClient.GET("/candidate/interviews", { params: { query: { page, pageSize: 100 } }, signal });
        if (!data || error) throw toApiError(response.status, error);
        items.push(...data.items);
        if (page >= data.meta.totalPages) return items;
    }
}

export async function acceptInterview(interviewId: string) {
    const csrf = await apiClient.GET("/auth/csrf");
    if (!csrf.data || csrf.error) throw toApiError(csrf.response.status, csrf.error);
    const { data, error, response } = await apiClient.POST("/candidate/interviews/{interviewId}/respond", {
        params: { path: { interviewId } }, headers: { "X-CSRF-Token": csrf.data.csrfToken }, body: { response: "accepted" },
    });
    if (!data || error) throw toApiError(response.status, error);
    return data;
}
