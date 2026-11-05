"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert, Button, Modal, ModalContent, ModalTrigger, useToast } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import type { ProfileEditorSection } from "../schemas/profile-editor";
import { useProfileDraft } from "./profile-draft-provider";

export function DeleteProfileEntry({ section, id, title }: { section: ProfileEditorSection; id: string; title: string }) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const { remove, busy, isError } = useProfileDraft();
    const { toast } = useToast();
    async function confirm() {
        setError("");
        try { await remove(section, id); setOpen(false); toast({ title: "Đã xóa mục hồ sơ" }); }
        catch (error) { setError(error instanceof ApiError ? error.message : "Không thể xóa. Vui lòng thử lại."); }
    }
    return <Modal open={open} onOpenChange={value => { if (!busy) { setOpen(value); setError(""); } }}>
        <ModalTrigger render={<button type="button" disabled={busy || isError} aria-label={`Xóa ${title}`} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" />}><Trash2 className="size-4" /></ModalTrigger>
        <ModalContent title="Xóa mục hồ sơ" description={`Bạn có muốn xóa “${title}” khỏi hồ sơ?`} footer={<><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Hủy</Button><Button loading={busy} onClick={() => void confirm()}>Xóa thông tin</Button></>}>
            {error && <Alert variant="error" title="Chưa thể xóa hồ sơ">{error}</Alert>}
        </ModalContent>
    </Modal>;
}
