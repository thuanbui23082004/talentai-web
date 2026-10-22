import Link from "next/link";
import { Bell, BriefcaseBusiness, CalendarDays, ChevronRight, FileCheck2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { NOTIFICATION_LABELS } from "../labels";
import type { Notification } from "../types";

export function NotificationItem({ item, compact = false, selected = false, onOpen }: { item: Notification; compact?: boolean; selected?: boolean; onOpen?: () => void }) {
    const Icon = item.type.startsWith("interview_") ? CalendarDays : item.type.startsWith("application_") ? FileCheck2 : item.type.startsWith("job_") ? BriefcaseBusiness : Bell;
    return <Link id={`notification-${item.id}`} href={`/candidate/notifications?notification=${item.id}#notification-${item.id}`} onClick={onOpen} aria-current={selected ? "true" : undefined} className={`group flex scroll-mt-24 items-start gap-3 rounded-xl p-4 transition-colors hover:bg-secondary/60 ${selected ? "bg-secondary ring-1 ring-primary/30" : !item.isRead ? "bg-secondary/35" : "bg-card"}`}>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.isRead ? "bg-muted text-muted-foreground" : "bg-secondary-hover text-primary"}`}><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2"><h3 className={`text-sm leading-5 ${item.isRead ? "font-medium" : "font-semibold"}`}>{item.title}</h3>{!item.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"><span className="sr-only">Chưa đọc</span></span>}</div>
            {item.body && <p className={`mt-1.5 text-xs leading-5 text-muted-foreground ${compact ? "line-clamp-2" : ""}`}>{item.body}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="font-medium text-primary">{NOTIFICATION_LABELS[item.type]}</span><span aria-hidden="true">·</span><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>{item.isRead && !compact && <span>· Đã đọc</span>}</div>
        </div>
        {!compact && <ChevronRight className="mt-1 hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" aria-hidden="true" />}
    </Link>;
}
