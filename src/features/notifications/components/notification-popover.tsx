"use client";

import { useState } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { ArrowRight, BellRing, X } from "lucide-react";
import { useUnreadCount } from "../hooks/use-notifications";
import { NotificationList } from "./notification-list";

export function NotificationPopover({ mobile = false }: { mobile?: boolean }) {
    const [open, setOpen] = useState(false);
    const count = useUnreadCount();
    const unread = count.data ?? 0;
    return <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger aria-label="Thông báo" className={`group relative flex items-center justify-center rounded-full text-white/85 transition-[background-color,color,transform] hover:scale-105 hover:bg-white hover:text-primary active:scale-95 ${mobile ? "size-10 border border-white/15 bg-white/10 sm:hidden" : "size-9"}`}>
            <BellRing className="size-[18px] stroke-[1.8] transition-transform group-hover:rotate-6" aria-hidden="true" />
            {unread > 0 && <span aria-hidden="true" className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-warning px-1 py-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-brand-deep group-hover:ring-white">{unread > 99 ? "99+" : unread}</span>}
        </Popover.Trigger>
        <Popover.Portal><Popover.Positioner side="bottom" align="end" sideOffset={14} collisionPadding={16} className="z-[60]">
            <Popover.Popup className="w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-float outline-none transition-[opacity,transform] data-starting:translate-y-2 data-starting:opacity-0 data-ending:opacity-0">
                <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><Popover.Title className="text-base font-semibold">Thông báo</Popover.Title><Popover.Description className="mt-1 text-xs text-muted-foreground">{unread > 0 ? `Bạn có ${unread} thông báo chưa đọc` : "Cập nhật mới nhất dành cho bạn"}</Popover.Description></div><Popover.Close aria-label="Đóng thông báo" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary"><X className="size-4" /></Popover.Close></div>
                <div className="max-h-[min(26rem,calc(100dvh-15rem))] overflow-y-auto overscroll-contain"><NotificationList compact filters={{ page: 1, pageSize: 5 }} enabled={open} onOpen={() => setOpen(false)} /></div>
                <Link href="/candidate/notifications" onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-center gap-2 border-t border-border bg-secondary/40 px-4 text-sm font-semibold text-primary hover:bg-secondary">Xem tất cả thông báo<ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Popover.Popup>
        </Popover.Positioner></Popover.Portal>
    </Popover.Root>;
}
