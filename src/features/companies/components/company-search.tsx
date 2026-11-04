"use client";

import { useState, useId } from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { Alert, Button, Input, Select } from "@/components/ui";
import { COMPANY_SIZES } from "@/lib/companies/search";
import { useCompanyCatalogs } from "../hooks/use-companies";
import type { CompanyFilters } from "../types";

export function CompanySearch({
    values,
    onSearch,
}: {
    values: CompanyFilters;
    onSearch: (values: CompanyFilters) => void;
}) {
    const [query, setQuery] = useState(values.q ?? "");
    const [minSize, setMinSize] = useState(String(values.minSize ?? ""));
    const [maxSize, setMaxSize] = useState(String(values.maxSize ?? ""));
    const [expanded, setExpanded] = useState(true);
    const catalogs = useCompanyCatalogs();
    const filterId = useId();
    const update = (patch: Partial<CompanyFilters>) =>
        onSearch({
            ...values,
            q: query.trim() || undefined,
            size: minSize || maxSize ? undefined : values.size,
            minSize: minSize ? Number(minSize) : undefined,
            maxSize: maxSize ? Number(maxSize) : undefined,
            ...patch,
            page: 1,
        });
    const industries =
        catalogs.data?.industries.map((item) => ({
            value: item.id,
            label: item.name,
        })) ?? [];
    const locations =
        catalogs.data?.locations.map((item) => ({
            value: item.id,
            label: item.name,
        })) ?? [];
    const location =
        values.locationId ??
        locations.find((item) => item.label === values.city)?.value ??
        "";
    return (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card text-left shadow-float">
            <form
                className="flex flex-col gap-3 bg-brand-deep p-3 sm:px-5 sm:py-4 md:flex-row"
                onSubmit={(event) => {
                    event.preventDefault();
                    update({});
                }}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-card p-1 sm:flex-row">
                    <Input
                        type="search"
                        aria-label="Tên công ty"
                        placeholder="Nhập tên công ty..."
                        value={query}
                        maxLength={200}
                        onChange={(event) => setQuery(event.target.value)}
                        className="min-w-0 flex-1"
                    />
                    <Select
                        aria-label="Địa điểm công ty"
                        placeholder="Tất cả tỉnh/thành"
                        value={location}
                        options={[
                            { value: "", label: "Tất cả tỉnh/thành" },
                            ...locations,
                        ]}
                        onValueChange={(value) =>
                            update({
                                locationId: value || undefined,
                                city: undefined,
                            })
                        }
                        disabled={catalogs.isPending || catalogs.isError}
                        className="min-w-0 sm:w-64"
                    />
                </div>
                <div className="flex shrink-0 gap-3">
                    <Button
                        type="submit"
                        variant="secondary"
                        className="h-12 flex-1 rounded-lg bg-card! px-5 text-sm text-primary! hover:bg-secondary! lg:px-7"
                    >
                        <Search className="size-4" />
                        Tìm kiếm
                    </Button>
                    <Button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={filterId}
                        variant="outline"
                        onClick={() => setExpanded(!expanded)}
                        className="h-12 rounded-lg border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/20"
                    >
                        <ChevronDown className={expanded ? "rotate-180" : ""} />
                        Bộ lọc
                    </Button>
                </div>
            </form>
            {catalogs.isError && (
                <Alert
                    variant="error"
                    title="Chưa tải được danh mục ngành nghề và địa điểm."
                    className="m-3"
                >
                    <Button
                        variant="outline"
                        onClick={() => void catalogs.refetch()}
                    >
                        Tải lại danh mục
                    </Button>
                </Alert>
            )}
            {expanded && (
                <div id={filterId} className="space-y-3 p-3 sm:px-5 sm:py-4">
                    <div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_140px_auto]">
                        <div className="col-span-2 min-w-0 sm:col-span-1">
                            <p className="mb-2 text-xs font-medium">
                                Ngành nghề
                            </p>
                            <Select
                                aria-label="Ngành nghề công ty"
                                placeholder={
                                    catalogs.isPending
                                        ? "Đang tải ngành nghề…"
                                        : "Tất cả ngành nghề"
                                }
                                value={values.industryId ?? ""}
                                options={[
                                    { value: "", label: "Tất cả ngành nghề" },
                                    ...industries,
                                ]}
                                disabled={
                                    catalogs.isPending || catalogs.isError
                                }
                                onValueChange={(value) =>
                                    update({ industryId: value || undefined })
                                }
                            />
                        </div>
                        <div className="col-span-2 min-w-0 sm:col-span-1">
                            <p className="mb-2 text-xs font-medium">Quy mô</p>
                            <Select
                                aria-label="Quy mô công ty"
                                placeholder="Tất cả quy mô"
                                value={values.size ?? ""}
                                options={[
                                    { value: "", label: "Tất cả quy mô" },
                                    ...COMPANY_SIZES.map((value) => ({
                                        value,
                                        label: `${value} nhân viên`,
                                    })),
                                ]}
                                onValueChange={(value) => {
                                    setMinSize("");
                                    setMaxSize("");
                                    update({
                                        size: (value ||
                                            undefined) as CompanyFilters["size"],
                                        minSize: undefined,
                                        maxSize: undefined,
                                    });
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <label
                                htmlFor={`${filterId}-min`}
                                className="mb-2 block text-xs font-medium"
                            >
                                Số nhân viên từ
                            </label>
                            <Input
                                id={`${filterId}-min`}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                step={1}
                                placeholder="Không giới hạn"
                                value={minSize}
                                onChange={(event) =>
                                    setMinSize(event.target.value)
                                }
                            />
                        </div>
                        <div className="min-w-0">
                            <label
                                htmlFor={`${filterId}-max`}
                                className="mb-2 block text-xs font-medium"
                            >
                                Số nhân viên đến
                            </label>
                            <Input
                                id={`${filterId}-max`}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                step={1}
                                placeholder="Không giới hạn"
                                value={maxSize}
                                onChange={(event) =>
                                    setMaxSize(event.target.value)
                                }
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            className="col-span-2 justify-self-end text-sm font-medium text-primary lg:col-span-1"
                            onClick={() => {
                                setQuery("");
                                setMinSize("");
                                setMaxSize("");
                                onSearch({});
                            }}
                        >
                            <RotateCcw className="size-4" />
                            Xóa lọc
                        </Button>
                    </div>
                    {catalogs.isSuccess && !industries.length && (
                        <p className="text-xs text-muted-foreground">
                            Chưa có danh mục ngành nghề.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
