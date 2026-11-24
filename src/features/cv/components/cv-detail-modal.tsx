"use client";

import { Alert, Badge, Button, Modal, ModalContent } from "@/components/ui";
import { CvFilePreview } from "@/components/shared/cv-file-preview";
import { LoadingState } from "@/components/shared/loading-state";
import { formatDate } from "@/lib/utils";
import { useCvDetail, useCvFile } from "../hooks/use-cvs";

export function CvDetailModal({ userId, id, onClose }: { userId: string; id: string; onClose: () => void }) {
    const query = useCvDetail(userId, id);
    const file = useCvFile(userId, id, query.isSuccess);
    return <Modal open onOpenChange={open => { if (!open) onClose(); }}>
        <ModalContent title="Chi tiết CV" className="max-w-4xl" footer={<Button variant="outline" onClick={onClose}>Đóng</Button>}>
            {query.isPending ? <LoadingState title="Đang tải chi tiết CV" /> : query.isError ? <Alert variant="error" title="Không tải được chi tiết CV"><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></Alert> : <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2"><h3 className="break-all text-lg font-semibold">{query.data.cvTitle || query.data.fileName}</h3>{query.data.isDefault && <Badge>Mặc định</Badge>}</div>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 text-sm">
                    <dt className="text-muted-foreground">Tên file</dt><dd className="break-all">{query.data.fileName}</dd>
                    <dt className="text-muted-foreground">Định dạng</dt><dd>{query.data.contentType === "application/pdf" ? "PDF" : "DOCX"}</dd>
                    <dt className="text-muted-foreground">Dung lượng</dt><dd>{(query.data.sizeBytes / 1024).toFixed(1)} KB</dd>
                    <dt className="text-muted-foreground">Phiên bản</dt><dd>{query.data.version}</dd>
                    <dt className="text-muted-foreground">Ngày tải lên</dt><dd>{formatDate(query.data.createdAt)}</dd>
                </dl>
                {file.isPending ? <LoadingState title="Đang tải tệp CV" /> : file.isError ? <Alert variant="error" title="Không tải được tệp CV"><Button variant="outline" onClick={() => void file.refetch()}>Thử lại</Button></Alert> : <CvFilePreview blob={file.data} fileName={query.data.fileName} />}
            </div>}
        </ModalContent>
    </Modal>;
}
