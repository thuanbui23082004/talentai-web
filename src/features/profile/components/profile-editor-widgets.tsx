"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Checkbox, Input } from "@/components/ui";
import { SKILL_SUGGESTIONS } from "../schemas/profile-editor";

const normalize = (text: string) => text.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export function SkillsPicker({ selected, onChange, error }: { selected: string[]; onChange: (skills: string[]) => void; error?: string }) {
    const [search, setSearch] = useState("");
    const names = Array.from(new Set([...selected, ...SKILL_SUGGESTIONS]));
    const filtered = names.filter((name) => normalize(name).includes(normalize(search)));
    const canCreate = search.trim() && !names.some((name) => normalize(name) === normalize(search));
    const toggle = (name: string) => onChange(selected.includes(name) ? selected.filter((skill) => skill !== name) : [...selected, name]);
    const add = () => { if (canCreate) { onChange([...selected, search.trim()]); setSearch(""); } };
    return <div className="space-y-3">
        <div className="flex items-center justify-between gap-3"><label htmlFor="profile-skills-search" className="ui-label">Kỹ năng <span className="text-destructive">*</span></label><span className="text-xs text-muted-foreground">Đã chọn {selected.length}</span></div>
        <Input id="profile-skills-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} leadingIcon={<Search />} placeholder="Tìm kiếm hoặc nhập kỹ năng mới" aria-invalid={!!error} aria-describedby={error ? "profile-skills-error" : undefined} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
        {!!selected.length && <ul aria-label="Kỹ năng đã chọn" className="flex flex-wrap gap-2">{selected.map((name) => <li key={name} className="flex max-w-full items-center gap-1 rounded-lg bg-secondary pl-3 text-xs font-medium text-primary"><span className="break-words">{name}</span><button type="button" aria-label={`Bỏ kỹ năng ${name}`} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-secondary-hover" onClick={() => toggle(name)}><X className="size-3.5" /></button></li>)}</ul>}
        <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-input p-2">
            {canCreate && <button type="button" onClick={add} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-primary hover:bg-secondary disabled:opacity-50"><Plus className="size-4 shrink-0" /><span className="break-words">Thêm mới: {search.trim()}</span></button>}
            {filtered.map((name) => <div key={name} className="rounded-lg p-3 hover:bg-secondary/40"><Checkbox label={name} checked={selected.includes(name)} onChange={() => toggle(name)} /></div>)}
            {!filtered.length && !canCreate && <p className="p-3 text-sm text-muted-foreground">Nhập tên để thêm kỹ năng mới.</p>}
        </div>
        {error && <p role="alert" id="profile-skills-error" className="text-xs text-destructive">{error}</p>}
    </div>;
}
