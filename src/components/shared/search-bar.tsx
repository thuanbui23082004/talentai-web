"use client";

import type { ReactNode } from "react";
import { useState, useId } from "react";
import { ChevronDown, MapPin, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";

export type SearchLocationRenderer = (props: { value: string; onChange: (value: string) => void }) => ReactNode;

export function SearchBar({
    onSearch,
    locations,
    filters,
    defaultQuery = "",
    defaultLocation = "",
    onReset,
    queryLabel = "Tên công việc, chức danh",
    stickyFilters = false,
    heading,
    onValuesChange,
    renderLocation,
    onLocationChange,
}: {
    onSearch: (values: { query: string; location: string }) => void;
    locations: SelectOption[];
    filters?: ReactNode;
    defaultQuery?: string;
    defaultLocation?: string;
    onReset?: () => void;
    queryLabel?: string;
    stickyFilters?: boolean;
    heading?: ReactNode;
    onValuesChange?: (values: { query: string; location: string }) => void;
    renderLocation?: SearchLocationRenderer;
    onLocationChange?: (values: { query: string; location: string }) => void;
}) {
    const [query, setQuery] = useState(defaultQuery);
    const [location, setLocation] = useState(defaultLocation);
    const [expanded, setExpanded] = useState(true);
    const filtersId = useId();
    const changeLocation = (value: string) => {
        setLocation(value);
        onValuesChange?.({ query, location: value });
        onLocationChange?.({ query, location: value });
    };
    return (
        <div className={stickyFilters ? "contents" : "overflow-hidden rounded-2xl border border-primary/10 bg-card text-left shadow-float"}>
            {heading && <h1 className="rounded-t-2xl bg-brand-deep px-5 pt-6 pb-1 text-xl leading-relaxed font-bold text-white sm:text-2xl">{heading}</h1>}
            <form
                id={`${filtersId}-form`}
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
                        onChange={(event) => { setQuery(event.target.value); onValuesChange?.({ query: event.target.value, location }); }}
                        className="flex-1 [&_input]:border-transparent [&_input]:font-medium [&_input]:shadow-none [&_input]:placeholder:text-muted-foreground"
                    />
                    <div className="flex min-w-0 items-center border-t px-1 sm:w-64 sm:border-t-0 sm:border-l">
                        <MapPin
                            className="ml-2 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                        />
                        {renderLocation ? renderLocation({ value: location, onChange: changeLocation }) : <Select
                            aria-label="Địa điểm tìm việc"
                            placeholder={
                                locations.find((option) => option.value === "")
                                    ?.label ?? "Tất cả địa điểm"
                            }
                            options={locations}
                            value={location}
                            onValueChange={(value) => changeLocation(value ?? "")}
                            className="border-transparent! font-medium text-primary! shadow-none!"
                        />}
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
                    className={`flex flex-nowrap items-center gap-2.5 overflow-x-auto bg-card p-4 [&>button]:w-auto [&>button]:shrink-0 sm:flex-wrap sm:overflow-visible sm:px-5 ${stickyFilters ? "sticky top-0 z-40 rounded-b-2xl border border-primary/10 shadow-card" : ""}`}
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
