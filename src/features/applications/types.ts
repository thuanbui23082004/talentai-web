import type { components } from "@/lib/api/generated/schema";
export type Application = components["schemas"]["Application"];
export type Interview = components["schemas"]["Interview"];
export type ApplicationFilters = { page?: number; pageSize?: number; q?: string; sort?: "newest" | "oldest"; status?: Application["status"][] };

export type RecruiterApplication = components['schemas']['RecruiterApplicationSummary'];
