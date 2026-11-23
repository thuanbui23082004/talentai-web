"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button, Input, Modal, ModalContent, ModalTrigger } from "@/components/ui";
import { normalizeLocation, provinceCity, provinces } from "@/lib/locations/vietnam";

export function encodeJobLocations(provinceCodes: string[], wardCodes: string[]) {
  return `${provinceCodes.join(",")}|${wardCodes.join(",")}`;
}

export function decodeJobLocations(value: string) {
  const [provincesPart = "", wardsPart = ""] = value.split("|");
  return {
    provinceCodes: provincesPart ? provincesPart.split(",") : [],
    wardCodes: wardsPart ? wardsPart.split(",") : [],
  };
}

export function JobLocationMultiPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [focusedProvince, setFocusedProvince] = useState("");
  const [provinceQuery, setProvinceQuery] = useState("");
  const [wardQuery, setWardQuery] = useState("");
  const selected = decodeJobLocations(value);
  const draftSelection = decodeJobLocations(draft);
  const focused = provinces.find((province) => province.code === focusedProvince);
  const visibleProvinces = provinces.filter((province) => normalizeLocation(province.name).includes(normalizeLocation(provinceQuery)));
  const visibleWards = focused?.wards.filter((ward) => normalizeLocation(ward.name).includes(normalizeLocation(wardQuery))) ?? [];
  const label = selected.provinceCodes.length === 0 ? "Tất cả địa điểm" : selected.provinceCodes.length === 1
    ? provinceCity(provinces.find((province) => province.code === selected.provinceCodes[0])?.name ?? "Địa điểm")
    : `${selected.provinceCodes.length} tỉnh/thành phố`;

  function toggleProvince(code: string) {
    const enabled = draftSelection.provinceCodes.includes(code);
    const nextProvinces = enabled ? draftSelection.provinceCodes.filter((item) => item !== code) : [...draftSelection.provinceCodes, code];
    const nextWards = enabled ? draftSelection.wardCodes.filter((wardCode) => !provinces.find((province) => province.code === code)?.wards.some((ward) => ward.code === wardCode)) : draftSelection.wardCodes;
    setDraft(encodeJobLocations(nextProvinces, nextWards));
    setFocusedProvince(code);
  }

  function toggleWard(code: string) {
    if (!focused) return;
    const nextProvinces = draftSelection.provinceCodes.includes(focused.code) ? draftSelection.provinceCodes : [...draftSelection.provinceCodes, focused.code];
    const nextWards = draftSelection.wardCodes.includes(code) ? draftSelection.wardCodes.filter((item) => item !== code) : [...draftSelection.wardCodes, code];
    setDraft(encodeJobLocations(nextProvinces, nextWards));
  }

  return <Modal open={open} onOpenChange={(next) => { setOpen(next); if (next) { setDraft(value); setFocusedProvince(decodeJobLocations(value).provinceCodes[0] ?? provinces[0]?.code ?? ""); setProvinceQuery(""); setWardQuery(""); } }}>
    <ModalTrigger type="button" aria-label="Địa điểm tìm việc" title={label} className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 px-3 text-left text-sm font-medium text-primary"><span className="truncate">{label}</span><ChevronDown className="size-4 shrink-0" /></ModalTrigger>
    <ModalContent title="Chọn địa điểm làm việc" description="Chọn nhiều tỉnh/thành. Nếu chọn phường/xã, kết quả chỉ gồm các phường/xã đó trong những tỉnh đã chọn." className="max-w-2xl p-4 sm:p-6" footer={<>
      <Button type="button" variant="outline" onClick={() => setDraft(encodeJobLocations([], []))}>Bỏ chọn tất cả</Button>
      <Button type="button" onClick={() => { onChange(draft); setOpen(false); }}>Áp dụng</Button>
    </>}>
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div className="min-w-0"><Input type="search" aria-label="Tìm tỉnh thành" placeholder="Nhập Tỉnh/Thành phố" value={provinceQuery} onChange={(event) => setProvinceQuery(event.target.value)} />
          <div className="mt-2 h-72 overflow-y-auto overscroll-contain" aria-label="Danh sách tỉnh thành">
            {visibleProvinces.map((province) => <div key={province.code} className={`flex min-h-10 items-center rounded-lg px-2 text-sm ${focusedProvince === province.code ? "bg-secondary" : ""}`}>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"><input type="checkbox" checked={draftSelection.provinceCodes.includes(province.code)} onChange={() => toggleProvince(province.code)} className="size-4 accent-primary" /><span className="truncate">{provinceCity(province.name)}</span></label>
              <button type="button" aria-label={`Xem phường xã của ${provinceCity(province.name)}`} onClick={() => { setFocusedProvince(province.code); setWardQuery(""); }} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-secondary-hover"><ChevronRight className="size-4" /></button>
            </div>)}
            {!visibleProvinces.length && <p className="p-2 text-sm text-muted-foreground">Không tìm thấy tỉnh/thành.</p>}
          </div>
        </div>
        <div className="min-w-0"><Input type="search" aria-label="Tìm phường xã" placeholder="Nhập Phường/Xã" disabled={!focused} value={wardQuery} onChange={(event) => setWardQuery(event.target.value)} />
          <div className="mt-2 h-72 overflow-y-auto overscroll-contain" aria-label="Danh sách phường xã">
            {focused ? <><label className="flex min-h-10 cursor-pointer items-center gap-2 px-2 text-sm font-medium"><input type="checkbox" checked={draftSelection.wardCodes.length === 0} onChange={() => setDraft(encodeJobLocations(draftSelection.provinceCodes, []))} className="size-4 accent-primary" />Không giới hạn phường/xã</label>
              {visibleWards.map((ward) => <label key={ward.code} className="flex min-h-10 cursor-pointer items-center gap-2 px-2 text-sm"><input type="checkbox" checked={draftSelection.wardCodes.includes(ward.code)} onChange={() => toggleWard(ward.code)} className="size-4 accent-primary" /><span className="truncate">{ward.name}</span></label>)}
              {!visibleWards.length && <p className="p-2 text-sm text-muted-foreground">Không tìm thấy phường/xã.</p>}</> : <p className="p-2 text-sm text-muted-foreground">Chọn tỉnh/thành để xem phường/xã.</p>}
          </div>
        </div>
      </div>
    </ModalContent>
  </Modal>;
}
