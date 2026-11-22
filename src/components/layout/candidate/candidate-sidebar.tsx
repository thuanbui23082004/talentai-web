"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell, ChevronLeft, ChevronRight, CircleHelp, FileUser,
    Search, Settings, SlidersHorizontal, UserRound,
} from "lucide-react";
import { AvailabilityButton } from "@/components/shared/availability-button";
import {
    candidateNavigation, candidateProfileNavigation, candidateSavedJobs,
} from "./candidate-navigation";

const menuClass = "flex min-h-11 w-full items-center gap-3 rounded-[9px] px-2 py-1 text-left text-[13px] transition-colors hover:bg-secondary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const profileIcons = [UserRound, SlidersHorizontal, FileUser] as const;

export function CandidateSidebar({
    onNavigate,
    collapsed = false,
    onToggleCollapse,
}: {
    onNavigate?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}) {
    const pathname = usePathname();
    const itemClass = `${menuClass} ${collapsed ? "justify-center" : ""}`;
    const labelClass = collapsed ? "sr-only" : "";
    const link = ({ href, label, Icon }: { href: string; label: string; Icon: typeof UserRound }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`${itemClass} ${active ? `${collapsed ? "" : "bg-secondary"} font-semibold text-primary` : "text-foreground/75"}`}
        >
            <span className={`grid size-[34px] shrink-0 place-items-center rounded-[10px] ${active ? "bg-primary text-primary-foreground" : ""}`}><Icon aria-hidden="true" className="size-[18px]" /></span>
            <span className={labelClass}>{label}</span>
        </Link>;
    };
    const heading = (label: string) => collapsed
        ? <div className="my-3 border-t border-border/60" />
        : <h2 className="mb-2 mt-5 px-2 text-[11px] font-normal text-muted-foreground first:mt-0">{label}</h2>;

    return <div className="flex h-full min-h-0 flex-col bg-card">
        {onToggleCollapse && (
            <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                aria-expanded={!collapsed}
                aria-controls="candidate-desktop-sidebar"
                title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                className="absolute top-4 -right-3 z-50 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                {collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronLeft className="size-4" aria-hidden="true" />}
            </button>
        )}
        <nav aria-label="Menu ứng viên" className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${collapsed ? "space-y-2 p-2" : "space-y-2 p-3"}`}>
            {!collapsed && <span className="mb-4 block px-2 text-[11px] text-muted-foreground">Không gian làm việc</span>}
            {link(candidateNavigation[0])}
            {heading("Hồ sơ ứng viên")}
            {candidateProfileNavigation.map((item, index) => link({ ...item, Icon: profileIcons[index] }))}
            {heading("Tìm kiếm việc làm")}
            {link({ href: "/jobs", label: "Tìm kiếm việc làm", Icon: Search })}
            {link(candidateNavigation[1])}
            {link(candidateSavedJobs)}
            {heading("Quản lý ứng tuyển")}
            {link(candidateNavigation[2])}
            {link({ href: "/candidate/notifications", label: "Thông báo", Icon: Bell })}
        </nav>
        <div className={`shrink-0 ${collapsed ? "space-y-2 p-2" : "space-y-2 p-3"}`}>
            {link({ href: "/candidate/settings", label: "Cài đặt tài khoản", Icon: Settings })}
            <AvailabilityButton title="Hỗ trợ" description="Khu vực hỗ trợ ứng viên đang được hoàn thiện." className={itemClass}>
                <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px]"><CircleHelp aria-hidden="true" className="size-[18px]" /></span>
                <span className={labelClass}>Hỗ trợ</span>
            </AvailabilityButton>
        </div>
    </div>;
}
