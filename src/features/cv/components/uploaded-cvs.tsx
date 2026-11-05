"use client";

import { useState } from "react";
import { Eye, FileText, Star, Trash2 } from "lucide-react";
import { Alert, Badge, Button, Modal, ModalContent, Pagination } from "@/components/ui";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";
import { useCvActions, useCvs } from "../hooks/use-cvs";
import type { UploadedCv } from "../types";
import { CvDetailModal } from "./cv-detail-modal";

const PAGE_SIZE = 6;
export function UploadedCvs({ userId }: { userId: string }) {
    const query = useCvs(userId);
    const actions = useCvActions(userId);
    const [page, setPage] = useState(1);
    const [detailId, setDetailId] = useState<string>();
    const [deleting, setDeleting] = useState<UploadedCv>();
    const [error, setError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [notice, setNotice] = useState("");
    const busy = actions.setDefault.isPending || actions.remove.isPending;
    const items = query.data ?? [];
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    async function setDefault(id: string) {
        setError(""); setNotice("");
        try { await actions.setDefault.mutateAsync(id); setNotice("Đã đặt CV mặc định."); }
        catch (error) { setError(error instanceof ApiError ? error.message : "Không thể đặt CV mặc định. Vui lòng thử lại."); }
    }
    async function remove() {
        if (!deleting) return;
        setDeleteError(""); setNotice("");
        try { await actions.remove.mutateAsync(deleting.id); setDeleting(undefined); setNotice("Đã xóa CV."); }
        catch (error) { setDeleteError(error instanceof ApiError ? error.message : "Không thể xóa CV. Vui lòng thử lại."); }
    }
    return <section aria-labelledby="uploaded-cvs-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
        <div className="mb-5"><h2 id="uploaded-cvs-heading" className="text-base font-semibold">CV của tôi</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">CV đã tải lên tài khoản. CV mặc định được ưu tiên khi chọn hồ sơ ứng tuyển.</p></div>
        {notice && <p role="status" className="mb-4 rounded-lg bg-success-soft px-3 py-2 text-xs text-success-foreground">{notice}</p>}
        {error && <Alert variant="error" title="Chưa thể cập nhật CV">{error}</Alert>}
        {query.isPending ? <LoadingState title="Đang tải danh sách CV" /> : query.isError ? <Alert variant="error" title="Không tải được danh sách CV"><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></Alert> : !items.length ? <EmptyState title="Bạn chưa có CV nào" description="Chọn file PDF hoặc DOCX ở mục tải lên để thêm CV đầu tiên." /> : <>
            <div className="grid gap-5 sm:grid-cols-2">{items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(cv => <article key={cv.id} aria-label={cv.fileName} className={`flex min-w-0 flex-col rounded-xl border p-4 ${cv.isDefault ? "border-primary/35 bg-secondary/20" : "border-border bg-card"}`}>
                <button type="button" onClick={() => setDetailId(cv.id)} className="relative mb-4 flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg bg-secondary/40 p-4 text-primary hover:bg-secondary" aria-label={`Xem chi tiết ${cv.fileName}`}>
                    <FileText className="size-12" strokeWidth={1.3} aria-hidden="true" />
                    <span className="text-xs font-semibold">{cv.contentType === "application/pdf" ? "PDF" : "DOCX"} · {(cv.sizeBytes / 1024).toFixed(1)} KB</span>
                    {cv.isDefault && <Badge className="absolute top-3 right-3"><Star className="size-3" />Mặc định</Badge>}
                </button>
                <h3 className="break-all text-sm font-semibold">{cv.cvTitle || cv.fileName}</h3>
                <p className="mt-1 break-all text-xs text-muted-foreground">{cv.fileName}</p>
                <p className="mt-2 text-xs text-muted-foreground">Tải lên {formatDate(cv.createdAt)} · Phiên bản {cv.version}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                    <Button variant="ghost" size="sm" className="min-h-11 px-2" onClick={() => setDetailId(cv.id)}><Eye />Chi tiết</Button>
                    <Button variant="ghost" size="sm" className="min-h-11 px-2 text-primary" disabled={busy || cv.isDefault || query.isFetching} onClick={() => void setDefault(cv.id)}><Star />{cv.isDefault ? "Mặc định" : "Đặt mặc định"}</Button>
                    <Button variant="ghost" size="icon" className="ml-auto text-destructive" disabled={busy} aria-label={`Xóa ${cv.fileName}`} onClick={() => { setDeleteError(""); setDeleting(cv); }}><Trash2 /></Button>
                </div>
            </article>)}</div>
            {totalPages > 1 && <Pagination className="mt-6" page={currentPage} totalPages={totalPages} onPageChange={setPage} />}
        </>}
        {detailId && <CvDetailModal userId={userId} id={detailId} onClose={() => setDetailId(undefined)} />}
        <Modal open={!!deleting} onOpenChange={open => { if (!open && !actions.remove.isPending) setDeleting(undefined); }}>
            <ModalContent title="Xóa CV?" description={`Bạn muốn xóa “${deleting?.fileName ?? ""}” khỏi tài khoản? Nếu xóa CV mặc định, hệ thống sẽ chọn CV còn lại gần nhất.`} footer={<><Button variant="outline" disabled={actions.remove.isPending} onClick={() => setDeleting(undefined)}>Hủy</Button><Button variant="destructive" loading={actions.remove.isPending} onClick={() => void remove()}>Xóa CV</Button></>}>
                {deleteError && <Alert variant="error" title="Chưa thể xóa CV">{deleteError}</Alert>}
            </ModalContent>
        </Modal>
    </section>;
}
