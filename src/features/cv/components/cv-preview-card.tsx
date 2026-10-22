"use client";

import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { CvPreviewDraft } from "../presentation";
import { ResumePaper } from "./resume-paper";

export function CvPreviewCard({ cv, onEdit, onPreview, onToggle, onDelete, onExport }: { cv: CvPreviewDraft; onEdit: () => void; onPreview: () => void; onToggle: () => void; onDelete: () => void; onExport: () => void }) {
    return <article aria-label={cv.title} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-float">
        <button type="button" onClick={onPreview} aria-label={`Xem trước ${cv.title}`} className="cv-paper-frame group relative block w-full overflow-hidden rounded-lg border border-border text-left">
            <ResumePaper {...cv} />
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/15 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><span className="rounded-lg bg-card px-4 py-2 text-xs font-semibold text-primary shadow-card">Xem trước CV</span></span>
        </button>
        <div className="mt-3 flex items-start justify-between gap-2"><h3 className="min-w-0 break-words text-sm font-semibold leading-6">{cv.title}</h3><button type="button" onClick={onEdit} aria-label={`Đổi tên ${cv.title}`} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary"><Pencil className="size-3.5" aria-hidden="true" /></button></div>
        <p className="mt-1 text-xs text-muted-foreground">Cập nhật {formatDate(cv.updatedAt)}</p>
        <button type="button" role="switch" aria-checked={cv.searchable} aria-label={`Cho phép nhà tuyển dụng tìm kiếm ${cv.title}`} onClick={onToggle} className="mt-2 flex min-h-11 items-center gap-2 text-left text-xs">
            <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${cv.searchable ? "bg-primary" : "bg-border"}`}><span className={`size-4 rounded-full bg-card shadow-sm transition-transform ${cv.searchable ? "translate-x-4" : ""}`} /></span><span className={cv.searchable ? "text-foreground" : "text-muted-foreground"}>{cv.searchable ? "Cho phép NTD tìm kiếm" : "Tạm dừng NTD tìm kiếm"}</span>
        </button>
        <div className="mt-1 grid grid-cols-4 border-t border-border/60 pt-1 text-xs"><button type="button" onClick={onEdit} className="min-h-11 text-left font-medium text-primary hover:underline">Chỉnh sửa</button><button type="button" onClick={onPreview} className="min-h-11 text-muted-foreground hover:text-primary">Xem trước</button><button type="button" onClick={onExport} className="min-h-11 text-muted-foreground hover:text-primary">Tải PDF</button><button type="button" onClick={onDelete} className="min-h-11 text-right text-destructive hover:underline">Xóa</button></div>
    </article>;
}
