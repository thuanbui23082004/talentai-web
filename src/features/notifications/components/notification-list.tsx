"use client";

import { Bell, RotateCw } from "lucide-react";
import { Alert, Button, Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useNotificationActions, useNotifications } from "../hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import type { NotificationFilters } from "../types";

export function NotificationList({ filters, compact, selectedId, onOpen, enabled = true }: { filters: NotificationFilters; compact?: boolean; selectedId?: string; onOpen?: () => void; enabled?: boolean }) {
    const query = useNotifications(filters, enabled);
    const { read } = useNotificationActions();
    if (query.isPending) return <div role="status" aria-label="Đang tải thông báo" className="space-y-3 p-4">{[1, 2, 3].map((key) => <Skeleton key={key} className="h-24 rounded-xl" />)}</div>;
    if (query.isError) return <div className="p-4"><Alert variant="error" title="Không thể tải thông báo">Vui lòng kiểm tra kết nối và thử lại.</Alert><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}><RotateCw />Thử lại</Button></div>;
    if (!query.data.items.length) return <EmptyState className="m-4 border-0" icon={<Bell />} title={filters.isRead === false ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"} description="Các cập nhật mới sẽ xuất hiện tại đây." />;
    return <div>
        {read.isError && <Alert variant="error" title="Chưa thể đánh dấu đã đọc">Vui lòng mở lại thông báo để thử lại.</Alert>}
        <ul className={`space-y-2 ${compact ? "p-2" : "p-3 sm:p-5"}`}>{query.data.items.map((item) => <li key={item.id}><NotificationItem item={item} compact={compact} selected={selectedId === item.id} onOpen={() => { if (!item.isRead) read.mutate(item.id); onOpen?.(); }} /></li>)}</ul>
    </div>;
}
