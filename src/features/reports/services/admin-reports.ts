import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/schema";

export type AdminReportFilters = { page: number; pageSize?: number; targetType?: "JOB" | "COMPANY"; status?: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" };
export type AdminReportUpdate = components["schemas"]["AdminViolationReportUpdate"];

export async function listAdminReports(filters: AdminReportFilters, signal?: AbortSignal) {
    const result = await apiClient.GET("/admin/violation-reports", { params: { query: { ...filters, pageSize: filters.pageSize ?? 20 } }, signal });
    if (!result.data || result.error) throw toApiError(result.response.status, result.error);
    return result.data;
}
export async function getAdminReport(id: string, signal?: AbortSignal) {
    const result = await apiClient.GET("/admin/violation-reports/{reportId}", { params: { path: { reportId: id } }, signal });
    if (!result.data || result.error) throw toApiError(result.response.status, result.error);
    return result.data;
}
export async function getReportedJob(id: string, signal?: AbortSignal) {
    const result = await apiClient.GET("/jobs/{jobId}", { params: { path: { jobId: id } }, signal });
    if (!result.data || result.error) throw toApiError(result.response.status, result.error);
    return result.data;
}
export async function updateAdminReport(id: string, input: AdminReportUpdate) {
    const csrf = await apiClient.GET("/auth/csrf");
    if (!csrf.data || csrf.error) throw toApiError(csrf.response.status, csrf.error);
    const result = await apiClient.PATCH("/admin/violation-reports/{reportId}", { params: { path: { reportId: id } }, headers: { "X-CSRF-Token": csrf.data.csrfToken }, body: input });
    if (!result.response.ok || result.error) throw toApiError(result.response.status, result.error);
}
