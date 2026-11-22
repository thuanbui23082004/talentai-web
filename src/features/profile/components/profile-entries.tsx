"use client";

import { FileText, Pencil, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { formatMonthYear } from "@/lib/utils";
import { Modal, ModalContent, ModalTrigger } from "@/components/ui";
import { type ProfileDraftEntry, type ProfileEditorSection } from "../schemas/profile-editor";
import { useProfileDraft } from "./profile-draft-provider";
import { ProfileAction } from "./profile-action";
import { DeleteProfileEntry } from "./delete-profile-entry";
import { sortProfileEntries } from "../sort-profile-entries";

function ProfileIntroduction({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const contentId = useId();

    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;
        const observer = new ResizeObserver(() => {
            const lineHeight = Number.parseFloat(getComputedStyle(content).lineHeight);
            setCanExpand(content.scrollHeight > lineHeight * 5 + 1);
        });
        observer.observe(content);
        return () => observer.disconnect();
    }, [text]);

    return <div className="relative">
        <p ref={contentRef} id={contentId} className={`whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground ${expanded ? "" : "line-clamp-5"}`}>{text}</p>
        {canExpand && <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(!expanded)} className={`inline-flex items-center whitespace-nowrap text-sm leading-6 font-medium text-primary hover:underline ${expanded ? "mt-1 min-h-11" : "absolute right-0 bottom-0 min-h-6 bg-card pl-2"}`}>{expanded ? "Thu gọn" : "… Xem thêm"}</button>}
    </div>;
}

function ProfileTimelineEntry({ section, entry }: { section: "experience" | "education"; entry: ProfileDraftEntry }) {
    const value = entry.values;
    const education = section === "education";
    const title = education ? value.name : value.position;
    const period = (date: string) => education ? date.slice(0, 4) : formatMonthYear(date.slice(0, 7));
    const start = value.startDate ? period(value.startDate) : "Chưa cập nhật";
    const end = value.current ? "Hiện tại" : value.endDate ? period(value.endDate) : "Chưa cập nhật";

    return <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 py-1 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:gap-x-5">
        <div className="col-span-2 sm:col-span-1">
            <span className="inline-flex min-h-8 items-center justify-center rounded-full bg-secondary/60 px-3 py-1.5 text-center text-xs font-medium leading-5 text-primary sm:w-full">
                {start} – {end}
            </span>
        </div>
        <div className="relative min-w-0 border-l border-primary/50 pb-2 pl-4 before:absolute before:top-1 before:-left-[4.5px] before:size-2 before:rounded-full before:bg-primary">
            <h3 className="break-words font-semibold">{title}</h3>
            {education ? <>
                {value.major && <p className="mt-1 break-words text-sm text-muted-foreground">{value.major}</p>}
                {value.degree && <p className="mt-1 break-words text-sm text-muted-foreground">{value.degree}</p>}
            </> : <p className="mt-1 break-words text-sm text-muted-foreground">{[value.company, value.address].filter(Boolean).join(" · ")}</p>}
            {value.description && <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">{value.description}</p>}
        </div>
        <div className="flex shrink-0 flex-col sm:flex-row">
            <ProfileAction section={section} entry={entry} className="flex size-11 items-center justify-center rounded-lg text-primary hover:bg-secondary">
                <Pencil className="size-4" />
                <span className="sr-only">Chỉnh sửa {title}</span>
            </ProfileAction>
            <DeleteProfileEntry section={section} id={entry.id} title={title} />
        </div>
    </article>;
}

function ProfileCertificateEntry({ entry }: { entry: ProfileDraftEntry }) {
    const value = entry.values;
    const hasFile = /^https?:\/\//i.test(value.attachmentUrl) || value.attachmentUrl.startsWith("/api/mock-media/");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 800, height: 800 });
    const isImage = value.attachmentContentType.startsWith("image/") || /\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(value.attachmentUrl);
    return <article className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <h3 className="break-words font-semibold">{value.name}</h3>
                {hasFile ? <Modal open={previewOpen} onOpenChange={setPreviewOpen}>
                    <ModalTrigger render={<button type="button" className="mt-2 inline-flex min-h-11 items-center gap-2 text-left text-sm text-primary hover:underline" />}>
                        <FileText aria-hidden="true" className="size-4 shrink-0" />
                        <span className="break-words">Xem chứng chỉ {value.name}</span>
                    </ModalTrigger>
                    {value.attachmentFileName && <p className="break-all text-xs text-muted-foreground">{value.attachmentFileName}</p>}
                    <ModalContent title={value.name} className={isImage ? "w-fit max-w-[calc(100vw-2rem)] overflow-hidden" : "flex h-[min(90dvh,56rem)] max-w-5xl flex-col overflow-hidden"} bodyClassName={isImage ? "w-fit max-w-full" : "min-h-0 flex-1"}>
                        {previewOpen && (isImage
                            ? <Image src={value.attachmentUrl} alt={`Chứng chỉ ${value.name}`} width={imageSize.width} height={imageSize.height} unoptimized onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="block h-auto max-h-[calc(100dvh-10rem)] w-auto max-w-full object-contain" />
                            : <iframe src={value.attachmentUrl} title={`Nội dung chứng chỉ ${value.name}`} className="size-full rounded-lg border border-border bg-white" />)}
                    </ModalContent>
                </Modal> : <ProfileAction section="certificates" entry={entry} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline"><Upload className="size-4" />Tải file chứng chỉ</ProfileAction>}
            </div>
            <DeleteProfileEntry section="certificates" id={entry.id} title={value.name} />
        </div>
    </article>;
}

export function ProfileEntries({ section }: { section: ProfileEditorSection }) {
    const { entries } = useProfileDraft();
    const items = entries[section] ?? [];
    const sorted = ["experience", "education", "projects"].includes(section) ? sortProfileEntries(items) : items;
    return <div className="space-y-3">{sorted.map((entry) => {
        const value = entry.values;
        const title = section === "experience" ? value.position : value.name;
        const displayDate = formatMonthYear;
        if (section === "skills") return <ul key={entry.id} className="flex flex-wrap gap-2">{value.skills.map((skill) => <li key={skill} className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-primary">{skill}</li>)}</ul>;
        if (section === "introduction") return <ProfileIntroduction key={entry.id} text={value.description} />;
        if (section === "certificates") return <ProfileCertificateEntry key={entry.id} entry={entry} />;
        if (section === "experience" || section === "education") return <ProfileTimelineEntry key={entry.id} section={section} entry={entry} />;
        return <article key={entry.id} className="relative rounded-xl border border-primary/15 bg-secondary/40 p-4 pr-16 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold">{title}</h3></div><div className="absolute top-2 right-2 flex shrink-0"><ProfileAction section={section} entry={entry} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-secondary"><Pencil className="size-4" /><span className="sr-only">Chỉnh sửa {title}</span></ProfileAction></div></div>
            {(value.startDate || value.endDate || value.current) && <p className="mt-2 text-xs text-primary">{value.startDate ? displayDate(value.startDate) : "Chưa có ngày bắt đầu"} – {value.current ? "Hiện tại" : value.endDate ? displayDate(value.endDate) : "Chưa có ngày kết thúc"}</p>}
            {value.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{value.description}</p>}
        </article>;
    })}</div>;
}
