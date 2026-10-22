"use client";

import { useState, type ReactNode } from "react";
import { Modal, ModalContent, ModalTrigger } from "@/components/ui";
import { emptyProfileDraft, type ProfileDraftEntry, type ProfileEditorSection } from "../schemas/profile-editor";
import { useProfileDraft } from "./profile-draft-provider";
import { ProfileEditorForm } from "./profile-editor-form";

const TITLES: Record<ProfileEditorSection, string> = { personal: "Chỉnh sửa thông tin cá nhân", introduction: "Giới thiệu bản thân", experience: "Kinh nghiệm làm việc", education: "Học vấn", skills: "Kỹ năng", projects: "Dự án/thành tựu", certificates: "Chứng chỉ/bằng cấp", languages: "Ngoại ngữ" };

export function ProfileAction({ section, children, className, entry, initialDegree }: { section: ProfileEditorSection; children: ReactNode; className?: string; entry?: ProfileDraftEntry; initialDegree?: string }) {
    const [open, setOpen] = useState(false);
    const { entries, personalDefaults, save } = useProfileDraft();
    const singleton = ["personal", "introduction", "skills", "languages"].includes(section);
    const previous = entry ?? (singleton ? entries[section]?.[0] : undefined);
    const initial = previous?.values ?? (section === "personal" ? personalDefaults : { ...emptyProfileDraft(section), degree: initialDegree ?? "" });
    return <Modal open={open} onOpenChange={setOpen}>
        <ModalTrigger render={<button type="button" className={className} />}>{children}</ModalTrigger>
        <ModalContent title={TITLES[section]} forceBackdrop className="flex h-[min(42rem,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden p-0 [&>div:first-child]:shrink-0 [&>div:first-child]:border-b [&>div:first-child]:border-border/60 [&>div:first-child]:py-5 [&>div:first-child]:pr-16 [&>div:first-child]:pl-5 sm:[&>div:first-child]:pl-8 [&>div.mt-6]:mt-0 [&>div.mt-6]:flex [&>div.mt-6]:min-h-0 [&>div.mt-6]:flex-1 [&>div.mt-6]:flex-col">
            {open && <ProfileEditorForm initial={initial} onCancel={() => setOpen(false)} onSave={(values) => { save(values, previous?.id); setOpen(false); }} />}
        </ModalContent>
    </Modal>;
}
