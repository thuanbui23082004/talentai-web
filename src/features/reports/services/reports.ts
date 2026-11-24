import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { ReportTarget, ViolationReportInput } from "../types";

export async function getMyReports(page = 1, signal?: AbortSignal) {
    const result = await apiClient.GET("/reports/my", { params: { query: { page, pageSize: 20 } }, signal });
    if (!result.data || result.error) throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function createReport(target: ReportTarget, input: ViolationReportInput) {
    const csrf = await apiClient.GET("/auth/csrf");
    if (!csrf.data || csrf.error) throw toApiError(csrf.response.status, csrf.error);
    const options = { body: input, headers: { "X-CSRF-Token": csrf.data.csrfToken } };
    const result = target === "jobs" ? await apiClient.POST("/reports/jobs", options) : await apiClient.POST("/reports/companies", options);
    if (!result.response.ok || result.error) throw toApiError(result.response.status, result.error);
}
