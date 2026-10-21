"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { SearchBar } from "./search-bar";

/** Presentation values. The consuming feature maps supported keys to its API contract. */
export type JobSearchValues = {
    query: string;
    location: string;
    quickRecruitment: boolean;
    filters: Record<string, string>;
};

export type JobSearchFilter = {
    key: string;
    label: string;
    options: SelectOption[];
    disabled?: boolean;
};

export type JobSearchBarProps = {
    locations: SelectOption[];
    filters?: JobSearchFilter[];
    initialValues?: Partial<JobSearchValues>;
    onSearch: (values: JobSearchValues) => void;
    onReset?: () => void;
    showQuickRecruitment?: boolean;
    quickRecruitmentDisabled?: boolean;
    queryLabel?: string;
};

export function JobSearchBar({
    locations,
    filters = [],
    initialValues,
    onSearch,
    onReset,
    showQuickRecruitment = false,
    quickRecruitmentDisabled = false,
    queryLabel,
}: JobSearchBarProps) {
    const [selected, setSelected] = useState(initialValues?.filters ?? {});
    const [quickRecruitment, setQuickRecruitment] = useState(initialValues?.quickRecruitment ?? false);

    return (
        <SearchBar
            locations={locations}
            defaultQuery={initialValues?.query}
            defaultLocation={initialValues?.location}
            queryLabel={queryLabel}
            onSearch={(values) => onSearch({ ...values, quickRecruitment, filters: selected })}
            onReset={() => {
                setSelected({});
                setQuickRecruitment(false);
                onReset?.();
            }}
            filters={
                <>
                    {showQuickRecruitment && (
                        <Button
                            variant={quickRecruitment ? "secondary" : "outline"}
                            aria-pressed={quickRecruitment}
                            disabled={quickRecruitmentDisabled}
                            title={quickRecruitmentDisabled ? "Tìm theo tuyển nhanh: sắp ra mắt" : undefined}
                            onClick={() => setQuickRecruitment(!quickRecruitment)}
                            className="gap-2 px-3 text-sm font-semibold"
                        >
                            <Zap className="text-primary" />
                            Tuyển nhanh
                        </Button>
                    )}
                    {filters.map((filter) => (
                        <Select
                            key={filter.key}
                            aria-label={filter.label}
                            placeholder={filter.label}
                            value={selected[filter.key] ?? ""}
                            disabled={filter.disabled}
                            options={[{ value: "", label: filter.label }, ...filter.options.filter((option) => option.value !== "")]}
                            onValueChange={(value) => setSelected((previous) => ({ ...previous, [filter.key]: value ?? "" }))}
                            className="w-full text-sm font-medium sm:w-auto sm:min-w-36"
                        />
                    ))}
                </>
            }
        />
    );
}
