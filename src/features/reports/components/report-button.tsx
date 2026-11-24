"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { useSession } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useCreateReport } from "../hooks/use-reports";
import { ApiError } from "@/lib/api/errors";
import { REASON_LABELS } from "../labels";
import type { ReportTarget, ViolationReportInput } from "../types";

export function ReportButton({ target, targetId, targetTitle }: { target: ReportTarget; targetId: string; targetTitle: string }) {
    const { user, isPending } = useSession();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<ViolationReportInput["reason"]>("FRAUD");
    const [description, setDescription] = useState("");
    const [evidenceUrl, setEvidenceUrl] = useState("");
    const mutation = useCreateReport();
    if (isPending) return <Button variant="outline" disabled><Flag size={16} /> Báo cáo vi phạm</Button>;
    if (!user) return <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm"><Flag size={16} />Báo cáo vi phạm</Link>;
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            await mutation.mutateAsync({ target, input: { targetId, targetTitle, reason, description: description.trim(), ...(evidenceUrl.trim() ? { evidenceUrl: evidenceUrl.trim() } : {}) } });
            setOpen(false); setDescription(""); setEvidenceUrl("");
        } catch { /* The mutation error is displayed in the form. */ }
    }
    return <>
        <Button variant="outline" onClick={() => { mutation.reset(); setOpen(true); }}><Flag size={16} /> Báo cáo vi phạm</Button>
        <Modal open={open} onOpenChange={setOpen}><ModalContent title={`Báo cáo ${target === "jobs" ? "việc làm" : "công ty"}`} description={targetTitle}>
            <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm font-medium">Lý do
                    <select value={reason} onChange={event => setReason(event.target.value as ViolationReportInput["reason"])} className="mt-1 w-full rounded-lg border border-border bg-card p-3">
                        {Object.entries(REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                <label className="block text-sm font-medium">Mô tả vi phạm
                    <textarea required maxLength={3000} rows={5} value={description} onChange={event => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card p-3" placeholder="Mô tả cụ thể dấu hiệu vi phạm" />
                </label>
                <label className="block text-sm font-medium">Liên kết bằng chứng (không bắt buộc)
                    <input type="url" maxLength={2048} value={evidenceUrl} onChange={event => setEvidenceUrl(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card p-3" placeholder="https://..." />
                </label>
                {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error instanceof ApiError && mutation.error.status === 409 ? "Báo cáo này đã được gửi và đang được xử lý." : "Không thể gửi báo cáo. Vui lòng thử lại."}</p>}
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Đang gửi…" : "Gửi báo cáo"}</Button></div>
            </form>
        </ModalContent></Modal>
    </>;
}
