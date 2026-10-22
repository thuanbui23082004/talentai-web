import type { ApplicationFilters } from "./types";
export const applicationKeys = {
    list: (userId: string | undefined, filters: ApplicationFilters) => ["applications", userId, filters] as const,
    interviews: (userId: string | undefined) => ["application-interviews", userId] as const,
};
