"use client";

import { useState } from "react";
import { Alert, Button, Modal, ModalContent } from "@/components/ui";
import { JOB_APPLICANT_TRANSITIONS } from "@/lib/api/job-applicant-transitions";
import { JOB_APPLICANT_STATUS_LABELS } from "../../job-applicant-messages";
import { useJobPipelineMove } from "../../hooks/use-job-pipeline";
import type { JobApplicant } from "../../types";

const ACTION_LABELS: Partial<Record<JobApplicant['status'], string>> = {
    reviewing: "Xem xét hồ sơ", shortlisted: "Đưa vào danh sách chọn",
    interview_scheduled: "Chuyển sang phỏng vấn", offered: "Gửi đề nghị",
    hired: "Đánh dấu đã tuyển", rejected: "Từ chối hồ sơ",
};

const COMPACT_ACTION_LABELS: Partial<Record<JobApplicant['status'], string>> = {
    reviewing: 'Xem xét', shortlisted: 'Danh sách chọn', interview_scheduled: 'Phỏng vấn',
    offered: 'Đề nghị', hired: 'Đã tuyển', rejected: 'Từ chối',
};

export function ApplicantStatusActions({ applicant, onUpdated, compact = false }: { applicant: JobApplicant; onUpdated: () => void; compact?: boolean }) {
    const move = useJobPipelineMove(applicant.jobId);
    const [confirmation, setConfirmation] = useState<"hired" | "rejected" | null>(null);
    const targets = JOB_APPLICANT_TRANSITIONS[applicant.status];

    function updateStatus(status: JobApplicant["status"]) {
        move.mutate({ id: applicant.id, values: { status, version: applicant.version } }, {
            onSuccess: () => setConfirmation(null),
            onSettled: onUpdated,
        });
    }

    return <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">{JOB_APPLICANT_STATUS_LABELS[applicant.status]}</span>
            {targets.map(status => <Button key={status} size="sm" className="min-h-11 sm:min-h-9" aria-label={ACTION_LABELS[status]} variant={status === "rejected" ? "outline" : "default"} disabled={move.isPending} onClick={() => {
                if (status === "hired" || status === "rejected") setConfirmation(status);
                else updateStatus(status);
            }}>{(compact ? COMPACT_ACTION_LABELS[status] : ACTION_LABELS[status]) || JOB_APPLICANT_STATUS_LABELS[status]}</Button>)}
        </div>
        {move.isSuccess && <p role="status" className={compact ? 'sr-only' : 'text-xs text-primary'}>Đã cập nhật trạng thái hồ sơ.</p>}
        {move.isError && <Alert variant="error" title="Chưa thể đổi trạng thái">Hồ sơ có thể vừa được cập nhật. Vui lòng tải lại kết quả rồi thử lại.</Alert>}
        <Modal open={confirmation !== null} onOpenChange={open => { if (!open && !move.isPending) setConfirmation(null); }}>
            {confirmation && <ModalContent title={confirmation === "hired" ? "Xác nhận tuyển ứng viên" : "Xác nhận từ chối hồ sơ"} footer={<><Button variant="outline" disabled={move.isPending} onClick={() => setConfirmation(null)}>Hủy</Button><Button loading={move.isPending} onClick={() => updateStatus(confirmation)}>Xác nhận</Button></>}>
                <p className="text-sm leading-6">Chuyển hồ sơ của <strong>{applicant.fullName || "ứng viên"}</strong> sang trạng thái <strong>{JOB_APPLICANT_STATUS_LABELS[confirmation]}</strong>?</p>
                {move.isError && <p role="alert" className="mt-3 text-sm text-destructive">Không thể cập nhật. Vui lòng tải lại hồ sơ trước khi thử lại.</p>}
            </ModalContent>}
        </Modal>
    </div>;
}
