"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Alert, Button, Pagination } from "@/components/ui";
import { useNotificationActions, useNotifications, useUnreadCount } from "../hooks/use-notifications";
import { NotificationList } from "./notification-list";

export function NotificationsPage({ selectedId }: { selectedId?: string }) {
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [page, setPage] = useState(1);
    const filters = { page, pageSize: 10, ...(unreadOnly ? { isRead: false } : {}) };
    const query = useNotifications(filters);
    const count = useUnreadCount();
    const { readAll } = useNotificationActions();
    return <div className="candidate-page space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Bell className="size-6" aria-hidden="true" /></span><div><h1 className="text-2xl font-bold tracking-tight">Thông báo</h1><p className="mt-1 text-sm text-muted-foreground">Theo dõi những cập nhật mới trên hành trình tìm việc.</p></div></div><Button variant="outline" disabled={!count.data || readAll.isPending} loading={readAll.isPending} onClick={() => readAll.mutate()}><CheckCheck />Đánh dấu tất cả đã đọc</Button></div>
        {readAll.isError && <Alert variant="error" title="Chưa thể cập nhật thông báo">Vui lòng thử đánh dấu tất cả đã đọc một lần nữa.</Alert>}
        <section aria-label="Danh sách thông báo" className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div className="flex gap-2" aria-label="Lọc thông báo">{[{ label: "Tất cả", unread: false }, { label: "Chưa đọc", unread: true }].map((filter) => <button key={filter.label} type="button" aria-pressed={unreadOnly === filter.unread} onClick={() => { setUnreadOnly(filter.unread); setPage(1); }} className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${unreadOnly === filter.unread ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground hover:bg-secondary hover:text-primary"}`}>{filter.label}{filter.unread && count.data !== undefined && <span className="rounded-full bg-card/20 px-2 text-xs">{count.data}</span>}</button>)}</div><span className="text-xs text-muted-foreground">{query.data ? `${query.data.meta.totalItems} thông báo` : "Cập nhật của bạn"}</span></div>
            <NotificationList filters={filters} selectedId={selectedId} />
            {!!query.data && query.data.meta.totalPages > 1 && <div className="border-t border-border p-4"><Pagination page={page} totalPages={query.data.meta.totalPages} onPageChange={setPage} /></div>}
        </section>
    </div>;
}
