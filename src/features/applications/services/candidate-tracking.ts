import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/schema";

export type CandidateTracking = components["schemas"]["CandidateApplicationTracking"];
export type CandidateTrackingStatus = CandidateTracking["status"];
export type CandidateTrackingHistory = components["schemas"]["CandidateApplicationTrackingHistory"];

export async function listCandidateApplications(page: number, status?: CandidateTrackingStatus, signal?: AbortSignal) {
    const result = await apiClient.GET("/candidate/application-tracking", {
        params: { query: { page, pageSize: 6, status } }, signal,
    });
    if (result.error || !result.data) throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function getCandidateApplication(id: string, signal?: AbortSignal) {
    const result = await apiClient.GET("/candidate/application-tracking/{applicationId}", {
        params: { path: { applicationId: id } }, signal,
    });
    if (result.error || !result.data) throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function getCandidateApplicationHistory(id: string, signal?: AbortSignal) {
    const result = await apiClient.GET("/candidate/application-tracking/{applicationId}/history", {
        params: { path: { applicationId: id } }, signal,
    });
    if (result.error || !result.data) throw toApiError(result.response.status, result.error);
    return result.data;
}
