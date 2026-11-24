"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMyReports } from "../hooks/use-reports";
import { REASON_LABELS, STATUS_LABELS } from "../labels";

function safeEvidenceUrl(value?: string) {
    if (!value) return undefined;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined; }
    catch { return undefined; }
}

export function MyReportsPage() {
    const [page, setPage] = useState(1);
    const query = useMyReports(page);
    const items = query.data?.items ?? [];
    const meta = query.data?.meta;
    const counts = { total: meta?.totalItems ?? 0, pending: items.filter(item => item.status === "PENDING").length, investigating: items.filter(item => item.status === "INVESTIGATING").length, done: items.filter(item => item.status === "RESOLVED" || item.status === "DISMISSED").length };
    return <main className="ui-container space-y-6 py-8"><header><h1 className="text-2xl font-bold">Báo cáo của tôi</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi các báo cáo vi phạm bạn đã gửi.</p></header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Tổng báo cáo", counts.total], ["Chờ tiếp nhận (trang này)", counts.pending], ["Đang xác minh (trang này)", counts.investigating], ["Đã kết thúc (trang này)", counts.done]].map(([label, count]) => <div key={label} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><strong className="mt-2 block text-xl text-primary">{count}</strong></div>)}</div>
        {query.isPending && <p role="status">Đang tải báo cáo…</p>}
        {query.isError && <div role="alert" className="rounded-xl border border-border bg-card p-5">Không thể tải báo cáo. <Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>}
        {!query.isPending && !query.isError && items.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-center">Bạn chưa gửi báo cáo nào.</div>}
        <ul className="space-y-3">{items.map(item => <li key={item.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={item.targetType === "JOB" ? `/jobs/${item.targetId}` : `/companies/${item.targetId}`} className="font-semibold text-primary hover:underline">{item.targetTitle || (item.targetType === "JOB" ? "Việc làm" : "Công ty")}</Link><p className="mt-1 text-xs text-muted-foreground">{item.targetType === "JOB" ? "Việc làm" : "Công ty"} · {REASON_LABELS[item.reason]} · {new Date(item.createdAt).toLocaleDateString("vi-VN")}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs">{STATUS_LABELS[item.status]}</span></div><p className="mt-3 whitespace-pre-wrap text-sm">{item.description}</p>{safeEvidenceUrl(item.evidenceUrl) && <a className="mt-2 inline-block text-sm text-primary underline" href={safeEvidenceUrl(item.evidenceUrl)} target="_blank" rel="noopener noreferrer">Xem bằng chứng</a>}</li>)}</ul>
        {!!meta && meta.totalPages > 1 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page}/{meta.totalPages}</span><Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Sau</Button></div>}
    </main>;
}
