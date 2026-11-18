"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useNotificationActions, useNotifications, useUnreadCount } from "../hooks/use-notifications";

export function RecruiterNotificationButton() {
    const [open, setOpen] = useState(false);
    const count = useUnreadCount();
    const notifications = useNotifications({ page: 1, pageSize: 5 }, open);
    const { read } = useNotificationActions();

    return <div className="notification-wrap">
        <Button variant="outline" size="icon" aria-label="Thông báo" aria-expanded={open} onClick={() => setOpen(!open)}>
            <Bell size={17} />
            {(count.data ?? 0) > 0 && <span className="notification-dot" aria-label={`${count.data} thông báo chưa đọc`} />}
        </Button>
        {open && <div className="notification-popover" role="region" aria-label="Thông báo">
            {notifications.isPending && <p role="status">Đang tải thông báo…</p>}
            {notifications.isError && <div role="alert">
                <p>Không thể tải thông báo.</p>
                <button type="button" onClick={() => void notifications.refetch()}>Thử lại</button>
            </div>}
            {notifications.data?.items.length === 0 && <p>Bạn chưa có thông báo mới.</p>}
            {!!notifications.data?.items.length && <ul className="max-h-80 overflow-y-auto">
                {notifications.data.items.map((item) => <li key={item.id} className="border-b border-border py-2 last:border-0">
                    <button type="button" className="w-full text-left" onClick={() => {
                        if (!item.isRead) read.mutate(item.id);
                    }}>
                        <span className={item.isRead ? "text-muted-foreground" : "font-semibold"}>{item.title}</span>
                        {item.body && <span className="mt-1 block text-xs text-muted-foreground">{item.body}</span>}
                        <time className="mt-1 block text-xs text-muted-foreground" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </button>
                </li>)}
            </ul>}
            {read.isError && <p role="alert">Chưa thể đánh dấu đã đọc. Vui lòng thử lại.</p>}
        </div>}
    </div>;
}
