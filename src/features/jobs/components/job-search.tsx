"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { JobSearchBar } from "@/components/shared/job-search-bar";
import { LocationPicker } from "@/components/shared/location-picker";
import { findProvinceByCity, provinceCity, resolveLocation } from "@/lib/locations/vietnam";
import { JOB_LOCATIONS, JOB_SEARCH_FILTERS } from "../search-options";
import type { JobFilters } from "../types";

export function JobSearch({ initialFilters = {}, queryLabel, stickyFilters, heading }: { initialFilters?: JobFilters; queryLabel?: string; stickyFilters?: boolean; heading?: ReactNode }) {
    const router = useRouter();
    const { q, city, minExperience, maxExperience, salaryMin, salaryMax, level, workType } = initialFilters;
    const provinceCode = initialFilters.provinceCode ?? findProvinceByCity(city)?.code;
    const location = provinceCode ? [provinceCode, initialFilters.wardCode].filter(Boolean).join(":") : city ?? "";
    return <JobSearchBar
        stickyFilters={stickyFilters}
        heading={heading}
        renderLocation={(props) => <LocationPicker {...props} />}
        key={JSON.stringify(initialFilters)}
        locations={city && !JOB_LOCATIONS.some((item) => item.value === city) ? [...JOB_LOCATIONS, { value: city, label: city }] : JOB_LOCATIONS}
        filters={JOB_SEARCH_FILTERS}
        showQuickRecruitment
        quickRecruitmentDisabled
        queryLabel={queryLabel}
        initialValues={{
            query: q ?? "", location, filters: {
                experience: minExperience === undefined && maxExperience === undefined ? "" : `${minExperience ?? ""}:${maxExperience ?? ""}`,
                salary: salaryMin === undefined && salaryMax === undefined ? "" : `${salaryMin ?? ""}:${salaryMax ?? ""}`,
                level: level?.[0] ?? "", workType: workType?.[0] ?? "",
            }
        }}
        onReset={() => router.push("/jobs")}
        onSearch={({ query, location, filters }) => {
            const params = new URLSearchParams();
            if (initialFilters.sort) params.set("sort", initialFilters.sort);
            if (initialFilters.pageSize) params.set("pageSize", String(initialFilters.pageSize));
            if(query) params.set("q", query);
            const { province, ward } = resolveLocation(location);
            if (province) {
                params.set("city", provinceCity(province.name));
                params.set("provinceCode", province.code);
                if (ward) params.set("wardCode", ward.code);
            } else if (location) params.set("city", location);
            for(const [key, min, max] of [["experience", "minExperience", "maxExperience"], ["salary", "salaryMin", "salaryMax"]]) {
                const [lower, upper] = (filters[key] ?? "").split(":");
                if(lower) params.set(min, lower);
                if(upper) params.set(max, upper);
            }
            for(const key of ["level", "workType"]) if(filters[key]) params.set(key, filters[key]);
            router.push(`/jobs${params.size ? `?${params}` : ""}`, { scroll: !stickyFilters });
        }}
    />;
}
