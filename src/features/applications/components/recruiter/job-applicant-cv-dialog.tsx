"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Button, Modal, ModalContent } from "@/components/ui";
import {
    useJobApplicantCv,
    useJobApplicantResume,
} from "../../hooks/use-recruiter-applications";
import type { JobApplicant } from "../../types";

export function JobApplicantCvDialog({
    item,
    onClose,
}: {
    item: JobApplicant;
    onClose: () => void;
}) {
    const pdf =
        item.resumeContentType === "application/pdf" ||
        /\.pdf$/i.test(item.resumeFileName ?? "");
    const cv = useJobApplicantCv(item.id, pdf);
    const download = useJobApplicantResume(item.id, !pdf);
    const query = pdf ? cv : download;
    return (
        <Modal
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <ModalContent
                title="CV ứng viên"
                description={
                    item.resumeFileName || "Bản CV đã nộp cùng hồ sơ ứng tuyển"
                }
                className="max-w-5xl"
            >
                {query.isPending ? (
                    <p role="status">Đang tải CV…</p>
                ) : query.isError ? (
                    <Alert variant="error" title="Không thể tải CV">
                        <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => void query.refetch()}
                        >
                            Thử lại
                        </Button>
                    </Alert>
                ) : pdf && cv.data ? (
                    <PdfFrame blob={cv.data} name={item.fullName} />
                ) : (
                    download.data && (
                        <>
                            <a
                                href={download.data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                            >
                                <ExternalLink size={16} aria-hidden="true" />
                                Mở tệp CV
                            </a>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Mở hoặc tải tệp CV để xem bằng ứng dụng đọc tài
                                liệu. Trình duyệt không hỗ trợ xem trực tiếp tệp
                                DOCX.
                            </p>
                        </>
                    )
                )}
            </ModalContent>
        </Modal>
    );
}

function PdfFrame({ blob, name }: { blob: Blob; name?: string }) {
    const [url, setUrl] = useState("");
    useEffect(() => {
        const objectUrl = URL.createObjectURL(blob);
        const frame = requestAnimationFrame(() => setUrl(objectUrl));
        return () => {
            cancelAnimationFrame(frame);
            URL.revokeObjectURL(objectUrl);
        };
    }, [blob]);
    return url ? (
        <>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
            >
                <ExternalLink size={16} aria-hidden="true" />
                Mở CV ở tab mới
            </a>
            <iframe
                title={`CV của ${name || "ứng viên"}`}
                src={url}
                className="h-[65dvh] min-h-80 w-full rounded-lg border border-border bg-muted"
            />
        </>
    ) : (
        <p role="status">Đang hiển thị CV…</p>
    );
}
