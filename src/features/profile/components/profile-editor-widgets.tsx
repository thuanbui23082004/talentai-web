"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Plus, Search, X } from "lucide-react";
import { Button, Checkbox, Input } from "@/components/ui";
import { SKILL_SUGGESTIONS } from "../schemas/profile-editor";

const normalize = (text: string) => text.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export function SkillsPicker({ selected, onChange, error }: { selected: string[]; onChange: (skills: string[]) => void; error?: string }) {
    const [search, setSearch] = useState("");
    const names = Array.from(new Set([...selected, ...SKILL_SUGGESTIONS]));
    const filtered = names.filter((name) => normalize(name).includes(normalize(search)));
    const canCreate = search.trim() && !names.some((name) => normalize(name) === normalize(search));
    const toggle = (name: string) => onChange(selected.includes(name) ? selected.filter((skill) => skill !== name) : selected.length < 20 ? [...selected, name] : selected);
    const add = () => { if (canCreate && selected.length < 20) { onChange([...selected, search.trim()]); setSearch(""); } };
    return <div className="space-y-3">
        <div className="flex items-center justify-between gap-3"><label htmlFor="profile-skills-search" className="ui-label">Kỹ năng <span className="text-destructive">*</span></label><span className="text-xs text-muted-foreground">Đã chọn {selected.length}/20</span></div>
        <Input id="profile-skills-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={60} leadingIcon={<Search />} placeholder="Tìm kiếm hoặc nhập kỹ năng mới" aria-invalid={!!error} aria-describedby={error ? "profile-skills-error" : undefined} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
        {!!selected.length && <ul aria-label="Kỹ năng đã chọn" className="flex flex-wrap gap-2">{selected.map((name) => <li key={name} className="flex max-w-full items-center gap-1 rounded-lg bg-secondary pl-3 text-xs font-medium text-primary"><span className="break-words">{name}</span><button type="button" aria-label={`Bỏ kỹ năng ${name}`} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-secondary-hover" onClick={() => toggle(name)}><X className="size-3.5" /></button></li>)}</ul>}
        <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-input p-2">
            {canCreate && <button type="button" disabled={selected.length >= 20} onClick={add} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-primary hover:bg-secondary disabled:opacity-50"><Plus className="size-4 shrink-0" /><span className="break-words">Thêm mới: {search.trim()}</span></button>}
            {filtered.map((name) => <div key={name} className="rounded-lg p-3 hover:bg-secondary/40"><Checkbox label={name} checked={selected.includes(name)} disabled={selected.length >= 20 && !selected.includes(name)} onChange={() => toggle(name)} /></div>)}
            {!filtered.length && !canCreate && <p className="p-3 text-sm text-muted-foreground">Nhập tên để thêm kỹ năng mới.</p>}
        </div>
        {error && <p role="alert" id="profile-skills-error" className="text-xs text-destructive">{error}</p>}
        {selected.length === 20 && <p role="status" className="text-xs text-muted-foreground">Đã đạt giới hạn 20 kỹ năng. Bỏ một kỹ năng để chọn thêm.</p>}
    </div>;
}

function CertificateImage({ file }: { file: File }) {
    const [src, setSrc] = useState("");
    useEffect(() => {
        const reader = new FileReader();
        reader.onload = () => { if (typeof reader.result === "string") setSrc(reader.result); };
        reader.readAsDataURL(file);
        return () => { if (reader.readyState === FileReader.LOADING) reader.abort(); };
    }, [file]);
    return src ? <Image src={src} unoptimized alt="Ảnh chứng chỉ đã chọn" width={160} height={100} className="h-24 w-40 rounded-lg border border-border bg-card object-contain" /> : <span className="h-24 w-40 rounded-lg bg-muted" role="status" aria-label="Đang xem trước ảnh" />;
}

export function CertificateUpload({ file, onChange, error }: { file: File | null; onChange: (file: File | null) => void; error?: string }) {
    return <div className="space-y-3">
        <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/20 bg-secondary/60 px-4 text-sm font-medium text-primary hover:bg-secondary has-focus-visible:ring-2 has-focus-visible:ring-primary"><ImagePlus className="size-4" />Tải lên hình ảnh<input type="file" aria-label="Ảnh chứng chỉ" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] ?? null)} /></label>
            <p className="mt-2 text-xs text-muted-foreground">Hỗ trợ PNG, JPG, JPEG; tối đa 5MB</p>
        </div>
        {file && <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">{!error && <CertificateImage key={`${file.name}-${file.size}-${file.lastModified}`} file={file} />}<p className="min-w-0 flex-1 break-words text-xs">{file.name}</p><Button variant="ghost" size="icon-sm" aria-label="Bỏ ảnh chứng chỉ" onClick={() => onChange(null)}><X /></Button></div>}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>;
}
