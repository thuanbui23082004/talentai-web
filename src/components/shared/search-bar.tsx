"use client";

import type { ReactNode } from "react";
import { useState, useId } from "react";
import { ChevronDown, MapPin, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";

export function SearchBar({
    onSearch,
    locations,
    filters,
    defaultQuery = "",
    defaultLocation = "",
    onReset,
    queryLabel = "Tên công việc, chức danh",
}: {
    onSearch: (values: { query: string; location: string }) => void;
    locations: SelectOption[];
    filters?: ReactNode;
    defaultQuery?: string;
    defaultLocation?: string;
    onReset?: () => void;
    queryLabel?: string;
}) {
    const [query, setQuery] = useState(defaultQuery);
    const [location, setLocation] = useState(defaultLocation);
    const [expanded, setExpanded] = useState(true);
    const filtersId = useId();
    return (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card text-left shadow-float">
            <form
                className="flex flex-col gap-3 bg-brand-deep p-4 sm:p-5 lg:flex-row"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSearch({ query: query.trim(), location });
                }}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl bg-card p-1 sm:flex-row sm:gap-0">
                    <Input
                        type="search"
                        aria-label={queryLabel}
                        placeholder="Nhập tên công việc, chức danh..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="flex-1 [&_input]:border-transparent [&_input]:font-medium [&_input]:shadow-none [&_input]:placeholder:text-muted-foreground"
                    />
                    <div className="flex min-w-0 items-center border-t px-1 sm:w-64 sm:border-t-0 sm:border-l">
                        <MapPin
                            className="ml-2 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                        />
                        <Select
                            aria-label="Địa điểm tìm việc"
                            placeholder={
                                locations.find((option) => option.value === "")
                                    ?.label ?? "Tất cả địa điểm"
                            }
                            options={locations}
                            value={location}
                            onValueChange={(value) => setLocation(value ?? "")}
                            className="border-transparent! font-medium text-primary! shadow-none!"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        type="submit"
                        variant="secondary"
                        className="h-[52px] flex-1 bg-card! px-8 text-primary! hover:bg-secondary!"
                    >
                        <Search />
                        Tìm kiếm
                    </Button>
                    {filters && (
                        <Button
                            aria-label="Bộ lọc"
                            aria-expanded={expanded}
                            aria-controls={filtersId}
                            onClick={() => setExpanded(!expanded)}
                            variant="outline"
                            className="h-[52px] border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
                        >
                            <ChevronDown className={expanded ? "rotate-180" : undefined} />
                            <span className="hidden sm:inline">Bộ lọc</span>
                        </Button>
                    )}
                </div>
            </form>
            {filters && expanded && (
                <div
                    id={filtersId}
                    className="flex flex-wrap items-center gap-2.5 p-4 sm:px-5"
                >
                    {filters}
                    <Button
                        variant="ghost"
                        className="ml-auto text-sm font-semibold text-primary"
                        onClick={() => {
                            setQuery("");
                            setLocation("");
                            onReset?.();
                        }}
                    >
                        <RotateCcw className="size-3.5" />
                        Xóa lọc
                    </Button>
                </div>
            )}
        </div>
    );
}
