"use client";

import { useState, useId } from "react";
import { ChevronDown, MapPin, RotateCcw, Search, ShieldCheck, BriefcaseBusiness } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { LocationPicker } from "@/components/shared/location-picker";
import { findProvinceByCity, provinceCity, resolveLocation } from "@/lib/locations/vietnam";
import { COMPANY_INDUSTRIES, COMPANY_SIZES } from "@/lib/companies/search";
import type { CompanyFilters } from "../types";

export function CompanySearch({ values, onSearch }: { values: CompanyFilters; onSearch: (values: CompanyFilters) => void }) {
    const [query, setQuery] = useState(values.q ?? "");
    const [city, setCity] = useState(values.city ?? "");
    const [expanded, setExpanded] = useState(true);
    const filterId = useId();
    const update = (patch: Partial<CompanyFilters>) => onSearch({ ...values, q: query.trim() || undefined, city: city || undefined, ...patch, page: 1 });
    return <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card text-left shadow-float">
        <form className="flex flex-col gap-3 bg-brand-deep p-3 sm:px-5 sm:py-4 md:flex-row" onSubmit={(event) => { event.preventDefault(); update({}); }}>
            <div className="flex min-w-0 flex-1 flex-col rounded-lg bg-card p-0.5 sm:flex-row">
                <Input type="search" aria-label="Tên công ty" placeholder="Nhập tên công ty..." value={query} maxLength={200} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 [&_input]:border-transparent [&_input]:shadow-none" />
                <div className="flex min-w-0 items-center border-t px-1 sm:w-64 sm:shrink-0 sm:border-t-0 sm:border-l">
                    <MapPin className="ml-2 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <LocationPicker
                        ariaLabel="Địa điểm công ty"
                        provinceOnly
                        value={findProvinceByCity(city)?.code ?? city}
                        onChange={(value) => {
                            const { province } = resolveLocation(value);
                            setCity(province ? provinceCity(province.name) : "");
                        }}
                    />
                </div>
            </div>
            <div className="flex shrink-0 gap-3"><Button type="submit" variant="secondary" className="h-12 flex-1 rounded-lg bg-card! px-5 text-sm text-primary! hover:bg-secondary! lg:px-7"><Search className="size-4" />Tìm kiếm</Button><Button type="button" aria-expanded={expanded} aria-controls={filterId} variant="outline" onClick={() => setExpanded(!expanded)} className="h-12 rounded-lg border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/20"><ChevronDown className={expanded ? "rotate-180" : ""} />Bộ lọc</Button></div>
        </form>
        {expanded && <div id={filterId} className="space-y-3 p-3 sm:px-5 sm:py-4">
            <div className="grid grid-cols-2 items-center gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] [&>button]:min-w-0 [&>button]:text-sm [&>button>span:first-child]:truncate">
                <Select aria-label="Ngành nghề công ty" placeholder="Tất cả ngành nghề" value={values.industryId ?? ""} options={[{ value: "", label: "Tất cả ngành nghề" }, ...COMPANY_INDUSTRIES]} onValueChange={(value) => update({ industryId: value || undefined })} className="text-sm" />
                <Select aria-label="Quy mô công ty" placeholder="Tất cả quy mô" value={values.size ?? ""} options={[{ value: "", label: "Tất cả quy mô" }, ...COMPANY_SIZES.map((value) => ({ value, label: `${value} nhân viên` }))]} onValueChange={(value) => update({ size: (value || undefined) as CompanyFilters["size"] })} className="text-sm" />
                <Select aria-label="Xác minh công ty" placeholder="Tất cả công ty" value={values.isVerified === undefined ? "" : String(values.isVerified)} options={[{ value: "", label: "Tất cả công ty" }, { value: "true", label: "Đã xác minh" }, { value: "false", label: "Chưa xác minh" }]} onValueChange={(value) => update({ isVerified: value ? value === "true" : undefined })} className="text-sm" />
                <Button type="button" variant="ghost" className="text-sm font-medium text-primary" onClick={() => { setQuery(""); setCity(""); onSearch({}); }}><RotateCcw className="size-4" />Xóa lọc</Button>
            </div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [&>button]:shrink-0 sm:flex-wrap sm:overflow-visible sm:pb-0" aria-label="Bộ lọc công ty nhanh">
                <button type="button" aria-pressed={values.isVerified === true} onClick={() => update({ isVerified: values.isVerified === true ? undefined : true })} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${values.isVerified === true ? "border-primary bg-primary text-white" : "border-border text-primary hover:bg-secondary"}`}><ShieldCheck className="size-3.5" />Công ty đã xác minh</button>
                <button type="button" aria-pressed={values.hiringOnly === true} onClick={() => update({ hiringOnly: values.hiringOnly ? undefined : true })} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${values.hiringOnly ? "border-primary bg-primary text-white" : "border-border hover:bg-secondary"}`}><BriefcaseBusiness className="size-3.5" />Đang có việc làm mới</button>
                {COMPANY_INDUSTRIES.map((industry) => <button key={industry.value} type="button" aria-pressed={values.industryId === industry.value} onClick={() => update({ industryId: values.industryId === industry.value ? undefined : industry.value })} className={`min-h-8 rounded-full border px-3 py-1 text-xs ${values.industryId === industry.value ? "border-primary bg-secondary text-primary" : "border-border hover:bg-secondary"}`}>{industry.label}</button>)}
            </div>
        </div>}
    </div>;
}
