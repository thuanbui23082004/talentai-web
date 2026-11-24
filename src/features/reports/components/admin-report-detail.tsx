"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getAdminReport, getReportedJob, updateAdminReport, type AdminReportUpdate } from "../services/admin-reports";
import { REASON_LABELS, STATUS_LABELS } from "../labels";

function safeEvidenceUrl(value?: string) {
    if (!value) return undefined;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined; }
    catch { return undefined; }
}

function ReportedJob({ id }: { id: string }) {
    const query = useQuery({ queryKey: ["admin", "reported-job", id], queryFn: ({ signal }) => getReportedJob(id, signal), retry: false });
    const job = query.data;
    return <section className="admin-user-info space-y-3" aria-labelledby="reported-job-title">
        <h2 id="reported-job-title">Tin tuyển dụng bị báo cáo</h2>
        {query.isPending && <p role="status">Đang tải tin tuyển dụng…</p>}
        {query.isError && <p role="alert">Không thể tải tin công khai. Tin có thể đã đóng hoặc không còn hiển thị.</p>}
        {job && <><h3 className="font-semibold">{job.title}</h3><p>{job.company.name} · {job.location.city}</p><div><strong>Mô tả công việc</strong><p className="admin-content-text whitespace-pre-wrap">{job.description}</p></div><div><strong>Yêu cầu</strong><p className="admin-content-text whitespace-pre-wrap">{job.requirements}</p></div><Link href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="admin-text-link">Mở toàn bộ tin tuyển dụng ↗</Link></>}
    </section>;
}

export function AdminReportDetailReal({ reportId }: { reportId: string }) {
    const client = useQueryClient();
    const query = useQuery({ queryKey: ["admin", "violation-reports", reportId], queryFn: ({ signal }) => getAdminReport(reportId, signal), retry: false });
    const [status, setStatus] = useState<AdminReportUpdate["status"] | "">("");
    const [note, setNote] = useState("");
    const [notice, setNotice] = useState(false);
    const mutation = useMutation({ mutationFn: (input: AdminReportUpdate) => updateAdminReport(reportId, input), onSuccess: (_data, input) => { client.setQueryData<Awaited<ReturnType<typeof getAdminReport>>>(["admin", "violation-reports", reportId], current => current ? { ...current, status: input.status, adminNote: input.adminNote } : current); setNotice(true); setStatus(""); void client.invalidateQueries({ queryKey: ["admin", "violation-reports"] }); } });
    const report = query.data;
    async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!status) return; setNotice(false); await mutation.mutateAsync({ status, ...(note.trim() ? { adminNote: note.trim() } : {}) }).catch(() => undefined); }
    return <div className="admin-users-page space-y-5"><Link href="/admin/reports" className="admin-text-link">← Trở lại danh sách</Link><div className="admin-users-heading"><h1>Chi tiết báo cáo</h1>{report && <span className="admin-badge">{STATUS_LABELS[report.status]}</span>}</div>
        {query.isPending && <p role="status">Đang tải báo cáo…</p>}
        {query.isError && <div role="alert">Không thể tải báo cáo. <Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>}
        {report && <><section className="admin-user-info admin-report-info"><h2>{report.targetTitle || report.targetId}</h2><dl className="admin-user-fields"><div><dt>Đối tượng</dt><dd>{report.targetType === "JOB" ? "Tin tuyển dụng" : "Doanh nghiệp"}</dd></div><div><dt>Lý do</dt><dd>{REASON_LABELS[report.reason]}</dd></div><div><dt>Ngày tiếp nhận</dt><dd>{new Date(report.createdAt).toLocaleString("vi-VN")}</dd></div><div><dt>Người gửi</dt><dd>{report.reporterUserId || "Chưa có thông tin"}</dd></div></dl><h3>Nội dung phản ánh</h3><p className="admin-content-text whitespace-pre-wrap">{report.description}</p>{safeEvidenceUrl(report.evidenceUrl) && <a href={safeEvidenceUrl(report.evidenceUrl)} target="_blank" rel="noopener noreferrer" className="admin-text-link">Xem bằng chứng</a>}{report.adminNote && <><h3>Ghi chú xử lý</h3><p className="admin-content-text">{report.adminNote}</p></>}</section>
            {report.targetType === "JOB" && <ReportedJob id={report.targetId} />}
            {report.targetType === "COMPANY" && <section className="admin-user-info"><h2>Doanh nghiệp bị báo cáo</h2><Link href={`/companies/${report.targetId}`} target="_blank" rel="noopener noreferrer" className="admin-text-link">Mở hồ sơ doanh nghiệp ↗</Link></section>}
            <form className="admin-access-panel admin-content-form" onSubmit={submit}><h2>Chuyển trạng thái</h2>{report.targetType === "JOB" && <p className="admin-content-muted">Đổi trạng thái báo cáo không tự ẩn hoặc khóa tin tuyển dụng.</p>}<label>Trạng thái mới<select required value={status} onChange={event => setStatus(event.target.value as AdminReportUpdate["status"])}><option value="">Chọn trạng thái</option><option value="INVESTIGATING">Đang xác minh</option><option value="RESOLVED">Đã xử lý</option><option value="DISMISSED">Đã đóng</option></select></label><label>Ghi chú xử lý<textarea rows={4} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} /></label>{mutation.isError && <p role="alert" className="admin-error">Không thể cập nhật báo cáo. Vui lòng thử lại.</p>}<Button type="submit" disabled={mutation.isPending || !status}>Lưu trạng thái</Button>{notice && <p role="status" className="admin-user-notice">Đã cập nhật trạng thái báo cáo.</p>}</form></>}
    </div>;
}
