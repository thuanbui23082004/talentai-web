import type { JobFilters } from "./types";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (filters: JobFilters) => [...jobKeys.all, "list", filters] as const,
};

export const savedJobKeys = {
  list: (userId?: string) => ["saved-jobs", userId, "list"] as const,
  mutations: (userId?: string) => ["saved-jobs", userId, "change"] as const,
};

export const recruiterJobKeys = {
  all: ['recruiter-jobs'] as const,
  lists: () => [...recruiterJobKeys.all, 'list'] as const,
  detail: (id: string) => [...recruiterJobKeys.all, 'detail', id] as const,
  options: () => [...recruiterJobKeys.all, 'options'] as const,
  locations: () => [...recruiterJobKeys.all, 'locations'] as const,
};
