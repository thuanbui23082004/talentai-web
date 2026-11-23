"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Alert, Button } from "@/components/ui";
import { JobSearchBar } from "@/components/shared/job-search-bar";
import { JobLocationMultiPicker, decodeJobLocations, encodeJobLocations } from "@/components/shared/job-location-multi-picker";
import { findProvinceByCity } from "@/lib/locations/vietnam";
import { JOB_LOCATIONS, JOB_SEARCH_FILTERS } from "../search-options";
import { useJobCategories } from "../hooks/use-jobs";
import type { JobFilters } from "../types";

export function JobSearch({
    initialFilters = {},
    queryLabel,
    stickyFilters,
    heading,
}: {
    initialFilters?: JobFilters;
    queryLabel?: string;
    stickyFilters?: boolean;
    heading?: ReactNode;
}) {
    const router = useRouter();
    const categories = useJobCategories();
    const {
        q,
        city,
        provinceCode,
        wardCode,
        provinceCodes,
        wardCodes,
        salaryMin,
        salaryMax,
        experienceLevel,
        jobType,
        workMode,
        categoryId,
    } = initialFilters;
    return (
        <>
            <JobSearchBar
                stickyFilters={stickyFilters}
                heading={heading}
                renderLocation={(props) => <JobLocationMultiPicker {...props} />}
                key={JSON.stringify(initialFilters)}
                locations={JOB_LOCATIONS}
                filters={[
                    ...JOB_SEARCH_FILTERS,
                    {
                        key: "categoryId",
                        label: "Tất cả ngành nghề",
                        disabled: categories.isPending || categories.isError,
                        options: (categories.data ?? []).map((item) => ({
                            value: String(item.categoryId),
                            label: item.categoryName,
                        })),
                    },
                ]}
                queryLabel={queryLabel}
                initialValues={{
                    query: q ?? "",
                    location: encodeJobLocations(provinceCodes ?? (provinceCode ? [provinceCode] : city && findProvinceByCity(city) ? [findProvinceByCity(city)!.code] : []), wardCodes ?? (wardCode ? [wardCode] : [])),
                    filters: {
                        salary:
                            salaryMin === undefined && salaryMax === undefined
                                ? ""
                                : `${salaryMin ?? ""}:${salaryMax ?? ""}`,
                        experienceLevel: experienceLevel ?? "",
                        jobType: jobType ?? "",
                        workMode: workMode ?? "",
                        categoryId: categoryId ? String(categoryId) : "",
                    },
                }}
                onReset={() => router.push("/jobs")}
                onSearch={({ query, location, filters }) => {
                    const params = new URLSearchParams();
                    if (initialFilters.sort)
                        params.set("sort", initialFilters.sort);
                    if (initialFilters.pageSize)
                        params.set("pageSize", String(initialFilters.pageSize));
                    if (initialFilters.companyId)
                        params.set("companyId", initialFilters.companyId);
                    if (query) params.set("q", query);
                    const selectedLocations = decodeJobLocations(location);
                    if (selectedLocations.provinceCodes.length) params.set("provinceCodes", selectedLocations.provinceCodes.join(","));
                    if (selectedLocations.wardCodes.length) params.set("wardCodes", selectedLocations.wardCodes.join(","));
                    const [lower, upper] = (filters.salary ?? "").split(":");
                    if (lower) params.set("salaryMin", lower);
                    if (upper) params.set("salaryMax", upper);
                    if (lower || upper) params.set("salaryCurrency", "VND");
                    for (const key of [
                        "experienceLevel",
                        "jobType",
                        "workMode",
                        "categoryId",
                    ])
                        if (filters[key]) params.set(key, filters[key]);
                    router.push(`/jobs${params.size ? `?${params}` : ""}`, {
                        scroll: !stickyFilters,
                    });
                }}
            />
            {categories.isError && (
                <Alert
                    variant="error"
                    title="Không tải được nhóm ngành tuyển dụng."
                    className="mt-3"
                >
                    <Button
                        variant="outline"
                        onClick={() => void categories.refetch()}
                    >
                        Tải lại ngành nghề
                    </Button>
                </Alert>
            )}
        </>
    );
}
