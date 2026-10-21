import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { CompanyFilters } from "../types";

export async function getCompanies(filters: CompanyFilters, signal?: AbortSignal) {
    const { data, error, response } = await apiClient.GET("/companies", { params: { query: filters }, signal });
    if (!data || error) throw toApiError(response.status, error);
    return data;
}
