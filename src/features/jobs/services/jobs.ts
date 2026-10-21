import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JobFilters } from "../types";

export async function getJobs(filters: JobFilters = {}, signal?: AbortSignal) {
  const { data, error, response } = await apiClient.GET("/jobs", { params: { query: filters }, signal });
  if (!data || error) throw toApiError(response.status, error);
  return data;
}
