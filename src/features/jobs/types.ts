import type { components, operations } from "@/lib/api/generated/schema";

export type Job = components["schemas"]["JobSummary"];
export type JobSearchResponse = components["schemas"]["JobSearchResponse"];
export type JobFilters = NonNullable<operations["searchJobs"]["parameters"]["query"]>;
