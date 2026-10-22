"use client";

import { Pencil } from "lucide-react";
import { formatMonthYear } from "@/lib/utils";
import { LANGUAGE_LEVELS, type ProfileEditorSection } from "../schemas/profile-editor";
import { useProfileDraft } from "./profile-draft-provider";
import { ProfileAction } from "./profile-action";

export function ProfileEntries({ section }: { section: ProfileEditorSection }) {
    const { entries } = useProfileDraft();
    return <div className="space-y-3">{entries[section]?.map((entry) => {
        const value = entry.values;
        if (section === "skills") return <ul key={entry.id} className="flex flex-wrap gap-2">{value.skills.map((skill) => <li key={skill} className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-primary">{skill}</li>)}</ul>;
        if (section === "languages") return <ul key={entry.id} className="grid gap-2 sm:grid-cols-2">{value.languages.map((language) => <li key={language.name} className="rounded-lg bg-secondary/40 px-3 py-2 text-sm">{language.name}<span className="ml-2 text-xs text-muted-foreground">{LANGUAGE_LEVELS.find((level) => level.value === language.level)?.label}</span></li>)}</ul>;
        if (section === "introduction") return <p key={entry.id} className="whitespace-pre-wrap break-words text-sm leading-6">{value.description}</p>;
        return <article key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold">{section === "experience" ? value.position : value.name}</h3>{section === "experience" && <p className="mt-1 break-words text-sm text-muted-foreground">{value.company}</p>}{section === "education" && <p className="mt-1 text-sm text-muted-foreground">{[value.major, value.degree].filter(Boolean).join(" · ")}</p>}</div><ProfileAction section={section} entry={entry} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-secondary"><Pencil className="size-4" /><span className="sr-only">Chỉnh sửa {section === "experience" ? value.position : value.name}</span></ProfileAction></div>
            {value.startDate && <p className="mt-2 text-xs text-primary">{formatMonthYear(value.startDate)} – {section === "experience" && value.current ? "Hiện tại" : formatMonthYear(value.endDate)}</p>}
            {value.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{value.description}</p>}
            {value.image && <p className="mt-2 break-words text-xs text-muted-foreground">Ảnh chứng chỉ: {value.image.name}</p>}
        </article>;
    })}</div>;
}
