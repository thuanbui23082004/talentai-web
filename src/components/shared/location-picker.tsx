"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button, Input, Modal, ModalContent, ModalTrigger } from "@/components/ui";
import { normalizeLocation, provinces, provinceCity, resolveLocation } from "@/lib/locations/vietnam";

export function LocationPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);
    const [provinceQuery, setProvinceQuery] = useState("");
    const [wardQuery, setWardQuery] = useState("");
    const selected = resolveLocation(value);
    const { province, ward } = resolveLocation(draft);
    const label = selected.province ? [selected.ward?.name, provinceCity(selected.province.name)].filter(Boolean).join(", ") : value || "Tất cả các địa điểm";
    const matches = (name: string, query: string) => normalizeLocation(name).includes(normalizeLocation(query));
    const visibleProvinces = provinces.filter((item) => matches(item.name, provinceQuery));
    const visibleWards = province?.wards.filter((item) => matches(item.name, wardQuery)) ?? [];

    return <Modal open={open} onOpenChange={(next) => { setOpen(next); if (next) { setDraft(value); setProvinceQuery(""); setWardQuery(""); } }}>
        <ModalTrigger type="button" aria-label="Địa điểm tìm việc" title={label} className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 px-3 text-left text-sm font-medium text-primary"><span className="truncate">{label}</span><ChevronDown className="size-4 shrink-0" /></ModalTrigger>
        <ModalContent title="Chọn địa điểm làm việc" description="Chọn tỉnh/thành, sau đó chọn phường/xã nếu muốn tìm chi tiết hơn." className="max-w-2xl p-4 sm:p-6" footer={<>
            <p className="mr-auto w-full text-sm text-muted-foreground sm:w-auto">{province ? [provinceCity(province.name), ward?.name].filter(Boolean).join(" · ") : "Tất cả địa điểm"}</p>
            <Button type="button" variant="outline" onClick={() => { setDraft(""); setWardQuery(""); }}>Bỏ chọn địa điểm</Button>
            <Button type="button" onClick={() => { onChange(draft); setOpen(false); }}>Chọn địa điểm</Button>
        </>}>
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div className="min-w-0">
                    <h3 className="mb-2 text-sm font-semibold">Tỉnh / Thành phố</h3>
                    <Input type="search" aria-label="Tìm tỉnh thành" placeholder="Tên tỉnh/thành..." value={provinceQuery} onChange={(event) => setProvinceQuery(event.target.value)} />
                    <div aria-label="Danh sách tỉnh thành" className="mt-2 h-64 space-y-1 overflow-y-auto overscroll-contain sm:h-80">
                        {visibleProvinces.map((item) => <button type="button" key={item.code} aria-pressed={province?.code === item.code} onClick={() => { setDraft(item.code); setWardQuery(""); }} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary ${province?.code === item.code ? "bg-secondary font-semibold text-primary" : ""}`}><span>{provinceCity(item.name)}</span>{province?.code === item.code && <Check className="size-4 shrink-0" />}</button>)}
                        {!visibleProvinces.length && <p className="p-2 text-sm text-muted-foreground">Không tìm thấy tỉnh/thành.</p>}
                    </div>
                </div>
                <div className="min-w-0">
                    <h3 className="mb-2 text-sm font-semibold">Phường / Xã / Đặc khu</h3>
                    <Input type="search" aria-label="Tìm phường xã" placeholder="Tên phường/xã..." disabled={!province} value={wardQuery} onChange={(event) => setWardQuery(event.target.value)} />
                    <div aria-label="Danh sách phường xã" className="mt-2 h-64 space-y-1 overflow-y-auto overscroll-contain sm:h-80">
                        {province ? <>
                            <button type="button" aria-pressed={!ward} onClick={() => setDraft(province.code)} className={`min-h-11 w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary ${!ward ? "bg-secondary font-semibold text-primary" : ""}`}>Tất cả phường/xã</button>
                            {visibleWards.map((item) => <button type="button" key={item.code} aria-pressed={ward?.code === item.code} onClick={() => setDraft(`${province.code}:${item.code}`)} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary ${ward?.code === item.code ? "bg-secondary font-semibold text-primary" : ""}`}><span>{item.name}</span>{ward?.code === item.code && <Check className="size-4 shrink-0" />}</button>)}
                            {!visibleWards.length && <p className="p-2 text-sm text-muted-foreground">Không tìm thấy phường/xã.</p>}
                        </> : <p className="p-3 text-sm leading-6 text-muted-foreground">Chọn tỉnh/thành để xem danh sách phường/xã.</p>}
                    </div>
                </div>
            </div>
        </ModalContent>
    </Modal>;
}
