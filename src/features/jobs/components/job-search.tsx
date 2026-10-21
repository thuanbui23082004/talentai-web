"use client";

import { useRouter } from "next/navigation";
import { JobSearchBar } from "@/components/shared/job-search-bar";
import { JOB_LOCATIONS, JOB_SEARCH_FILTERS } from "../search-options";
import type { JobFilters } from "../types";

export function JobSearch({ initialFilters = {}, queryLabel }: { initialFilters?: JobFilters; queryLabel?: string }) {
    const router = useRouter();
    const { q, city, minExperience, maxExperience, salaryMin, salaryMax, level, workType } = initialFilters;
    return <JobSearchBar
        key={JSON.stringify(initialFilters)}
        locations={city && !JOB_LOCATIONS.some((item) => item.value === city) ? [...JOB_LOCATIONS, { value: city, label: city }] : JOB_LOCATIONS}
        filters={JOB_SEARCH_FILTERS}
        showQuickRecruitment
        quickRecruitmentDisabled
        queryLabel={queryLabel}
        initialValues={{
            query: q ?? "", location: city ?? "", filters: {
                experience: minExperience === undefined && maxExperience === undefined ? "" : `${minExperience ?? ""}:${maxExperience ?? ""}`,
                salary: salaryMin === undefined && salaryMax === undefined ? "" : `${salaryMin ?? ""}:${salaryMax ?? ""}`,
                level: level?.[0] ?? "", workType: workType?.[0] ?? "",
            }
        }}
        onReset={() => router.push("/jobs")}
        onSearch={({ query, location, filters }) => {
            const params = new URLSearchParams();
            if(query) params.set("q", query);
            if(location) params.set("city", location);
            for(const [key, min, max] of [["experience", "minExperience", "maxExperience"], ["salary", "salaryMin", "salaryMax"]]) {
                const [lower, upper] = (filters[key] ?? "").split(":");
                if(lower) params.set(min, lower);
                if(upper) params.set(max, upper);
            }
            for(const key of ["level", "workType"]) if(filters[key]) params.set(key, filters[key]);
            router.push(`/jobs${params.size ? `?${params}` : ""}`);
        }}
    />;
}
