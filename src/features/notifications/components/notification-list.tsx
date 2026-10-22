"use client";

import { Bell, RotateCw } from "lucide-react";
import { Alert, Button, Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { FeedbackState } from "@/components/shared/feedback-state";
import { useNotificationActions, useNotifications } from "../hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import type { NotificationFilters } from "../types";

export function NotificationList({ filters, compact, selectedId, onOpen, enabled = true }: { filters: NotificationFilters; compact?: boolean; selectedId?: string; onOpen?: () => void; enabled?: boolean }) {
    const query = useNotifications(filters, enabled);
    const { read } = useNotificationActions();
    if (query.isPending) return <div role="status" aria-label="Đang tải thông báo" className="space-y-3 p-4">{[1, 2, 3].map((key) => <Skeleton key={key} className="h-24 rounded-xl" />)}</div>;
    if (query.isError) return <FeedbackState className="m-4" kind="error" variant={compact ? "compact" : "section"} title="Không thể tải thông báo" description="Vui lòng kiểm tra kết nối và thử lại." action={<Button variant="outline" onClick={() => void query.refetch()}><RotateCw />Thử lại</Button>} />;
    if (!query.data.items.length) return <EmptyState className="m-4 border-0" compact={compact} icon={<Bell />} title={filters.isRead === false ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"} description="Các cập nhật mới sẽ xuất hiện tại đây." />;
    return <div>
        {read.isError && <Alert variant="error" title="Chưa thể đánh dấu đã đọc">Vui lòng mở lại thông báo để thử lại.</Alert>}
        <ul className={`space-y-2 ${compact ? "p-2" : "p-3 sm:p-5"}`}>{query.data.items.map((item) => <li key={item.id}><NotificationItem item={item} compact={compact} selected={selectedId === item.id} onOpen={() => { if (!item.isRead) read.mutate(item.id); onOpen?.(); }} /></li>)}</ul>
    </div>;
}
