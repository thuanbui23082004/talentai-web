"use client";
import { useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { listAdminReports, type AdminReportFilters } from "../services/admin-reports";
import { REASON_LABELS, STATUS_LABELS } from "../labels";

export function AdminReportList() {
    const [filters, setFilters] = useState<AdminReportFilters>({ page: 1 });
    const query = useQuery({ queryKey: ["admin", "violation-reports", filters], queryFn: ({ signal }) => listAdminReports(filters, signal), retry: false });
    const statuses = ["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"] as const;
    const totals = useQueries({ queries: statuses.map(status => ({ queryKey: ["admin", "violation-reports", "total", status], queryFn: ({ signal }: { signal: AbortSignal }) => listAdminReports({ page: 1, pageSize: 1, status }, signal), retry: false })) });
    const items = query.data?.items ?? [];
    const meta = query.data?.meta;
    return <div className="admin-users-page space-y-5"><div className="admin-users-heading"><div><h1>Báo cáo người dùng</h1><p>Kiểm tra và xử lý báo cáo về tin tuyển dụng, doanh nghiệp.</p></div><Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Làm mới</Button></div>
        <div className="admin-report-summary">{statuses.map((status, index) => <div key={status}><span>{STATUS_LABELS[status]}</span><strong>{totals[index].data?.meta.totalItems ?? "—"}</strong></div>)}</div>
        <div className="admin-user-filters flex flex-wrap gap-3"><label>Đối tượng<select value={filters.targetType ?? ""} onChange={event => setFilters({ ...filters, targetType: event.target.value as AdminReportFilters["targetType"] || undefined, page: 1 })}><option value="">Tất cả</option><option value="JOB">Tin tuyển dụng</option><option value="COMPANY">Doanh nghiệp</option></select></label><label>Trạng thái<select value={filters.status ?? ""} onChange={event => setFilters({ ...filters, status: event.target.value as AdminReportFilters["status"] || undefined, page: 1 })}><option value="">Tất cả</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Button variant="ghost" onClick={() => setFilters({ page: 1 })}>Xóa bộ lọc</Button></div>
        {query.isPending && <p role="status">Đang tải báo cáo…</p>}
        {query.isError && <div role="alert">Không thể tải báo cáo. <Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>}
        {!query.isPending && !query.isError && items.length === 0 && <p className="admin-state">Không có báo cáo phù hợp.</p>}
        {items.length > 0 && <div className="admin-table-scroll"><table className="admin-users-table"><thead><tr><th>Đối tượng</th><th>Lý do</th><th>Trạng thái</th><th>Ngày tiếp nhận</th><th>Thao tác</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.targetTitle || item.targetId}</strong><small className="admin-content-aliases">{item.targetType === "JOB" ? "Tin tuyển dụng" : "Doanh nghiệp"}</small></td><td>{REASON_LABELS[item.reason]}</td><td><span className="admin-badge">{STATUS_LABELS[item.status]}</span></td><td>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td><td><Link className="admin-text-link" href={`/admin/reports/${item.id}`}>Xem chi tiết</Link></td></tr>)}</tbody></table></div>}
        {meta && meta.totalPages > 1 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Trước</Button><span>Trang {filters.page}/{meta.totalPages} · {meta.totalItems} báo cáo</span><Button variant="outline" disabled={filters.page >= meta.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Sau</Button></div>}
    </div>;
}
