"use client";

import { Pencil } from "lucide-react";
import { formatDate, formatMonthYear } from "@/lib/utils";
import { LANGUAGE_LEVELS, type ProfileEditorSection } from "../schemas/profile-editor";
import { useProfileDraft } from "./profile-draft-provider";
import { ProfileAction } from "./profile-action";
import { DeleteProfileEntry } from "./delete-profile-entry";
import { isCareerSection } from "../career-mapping";

export function ProfileEntries({ section }: { section: ProfileEditorSection }) {
    const { entries } = useProfileDraft();
    return <div className="space-y-3">{entries[section]?.map((entry) => {
        const value = entry.values;
        const title = section === "experience" ? value.position : value.name;
        const displayDate = isCareerSection(section) ? formatDate : formatMonthYear;
        if (section === "skills") return <ul key={entry.id} className="flex flex-wrap gap-2">{value.skills.map((skill) => <li key={skill} className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-primary">{skill}</li>)}</ul>;
        if (section === "languages") return <ul key={entry.id} className="grid gap-2 sm:grid-cols-2">{value.languages.map((language) => <li key={language.name} className="rounded-lg bg-secondary/40 px-3 py-2 text-sm">{language.name}<span className="ml-2 text-xs text-muted-foreground">{LANGUAGE_LEVELS.find((level) => level.value === language.level)?.label}</span></li>)}</ul>;
        if (section === "introduction") return <p key={entry.id} className="whitespace-pre-wrap break-words text-sm leading-6">{value.description}</p>;
        return <article key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold">{title}</h3>{section === "experience" && <p className="mt-1 break-words text-sm text-muted-foreground">{[value.company, value.address].filter(Boolean).join(" · ")}</p>}{section === "education" && <p className="mt-1 text-sm text-muted-foreground">{[value.major, value.degree].filter(Boolean).join(" · ")}</p>}</div><div className="flex shrink-0">{section !== "certificates" && <ProfileAction section={section} entry={entry} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-secondary"><Pencil className="size-4" /><span className="sr-only">Chỉnh sửa {title}</span></ProfileAction>}{isCareerSection(section) && <DeleteProfileEntry section={section} id={entry.id} title={title} />}</div></div>
            {(value.startDate || value.endDate || value.current) && <p className="mt-2 text-xs text-primary">{value.startDate ? displayDate(value.startDate) : "Chưa có ngày bắt đầu"} – {value.current ? "Hiện tại" : value.endDate ? displayDate(value.endDate) : section === "certificates" ? "Không có ngày hết hạn" : "Chưa có ngày kết thúc"}</p>}
            {value.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{value.description}</p>}
            {section === "certificates" && <div className="mt-2 space-y-1 text-sm text-muted-foreground">{value.issuer && <p className="break-words">{value.issuer}</p>}{value.credentialId && <p className="break-words">Mã chứng chỉ: {value.credentialId}</p>}{/^https?:\/\//i.test(value.credentialUrl) && <a href={value.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center break-all text-primary hover:underline">Xem chứng chỉ</a>}</div>}
        </article>;
    })}</div>;
}
