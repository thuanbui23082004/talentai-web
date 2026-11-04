"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { jobKeys } from "../query-keys";
import { getJobs, getJobCategories } from "../services/jobs";
import type { JobFilters, JobSearchResponse } from "../types";

export function useJobCategories() {
  return useQuery({ queryKey: jobKeys.categories, queryFn: ({ signal }) => getJobCategories(signal), staleTime: 60000 });
}

export function useJobs(filters: JobFilters, initialData?: JobSearchResponse, enabled = true) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: ({ signal }) => getJobs(filters, signal),
    placeholderData: keepPreviousData,
    initialData,
    enabled,
  });
}
