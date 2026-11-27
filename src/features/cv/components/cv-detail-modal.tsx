"use client";

import { Alert, Badge, Button, Modal, ModalContent } from "@/components/ui";
import { CvFilePreview } from "@/components/shared/cv-file-preview";
import { LoadingState } from "@/components/shared/loading-state";
import { formatDate } from "@/lib/utils";
import { useCvDetail, useCvFile } from "../hooks/use-cvs";
import { FileText } from "lucide-react";

export function CvDetailModal({ userId, id, onClose }: { userId: string; id: string; onClose: () => void }) {
    const query = useCvDetail(userId, id);
    const file = useCvFile(userId, id, query.isSuccess);
    return <Modal open onOpenChange={open => { if (!open) onClose(); }}>
        <ModalContent title="Chi tiết CV" className="max-w-4xl" footer={<Button variant="outline" onClick={onClose}>Đóng</Button>}>
            {query.isPending ? <LoadingState title="Đang tải chi tiết CV" /> : query.isError ? <Alert variant="error" title="Không tải được chi tiết CV"><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></Alert> : <div className="space-y-5">
                <section aria-label="Thông tin CV" className="rounded-xl border border-border bg-secondary/20 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><FileText className="size-5" aria-hidden="true" /></span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="break-words text-base font-semibold leading-6">{query.data.cvTitle || query.data.fileName}</h3>
                                {query.data.isDefault && <Badge>Mặc định</Badge>}
                            </div>
                            <p className="mt-1 break-all text-sm text-muted-foreground"><span className="sr-only">Tên file: </span>{query.data.fileName}</p>
                        </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
                        <div><dt className="text-xs text-muted-foreground">Định dạng</dt><dd className="mt-1 font-medium">{query.data.contentType === "application/pdf" ? "PDF" : "DOCX"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Dung lượng</dt><dd className="mt-1 font-medium">{(query.data.sizeBytes / 1024).toFixed(1)} KB</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Phiên bản</dt><dd className="mt-1 font-medium">{query.data.version}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Ngày tải lên</dt><dd className="mt-1 font-medium">{formatDate(query.data.createdAt)}</dd></div>
                    </dl>
                </section>
                {file.isPending ? <LoadingState title="Đang tải tệp CV" /> : file.isError ? <Alert variant="error" title="Không tải được tệp CV"><Button variant="outline" onClick={() => void file.refetch()}>Thử lại</Button></Alert> : <CvFilePreview blob={file.data} fileName={query.data.fileName} />}
            </div>}
        </ModalContent>
    </Modal>;
}
