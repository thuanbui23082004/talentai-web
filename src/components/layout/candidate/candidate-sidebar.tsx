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

const menuClass = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-secondary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
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
            className={`${itemClass} ${active ? "bg-secondary/80 text-primary" : "text-foreground"}`}
        >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className={labelClass}>{label}</span>
        </Link>;
    };
    const heading = (label: string) => collapsed
        ? <div className="my-3 border-t border-border/60" />
        : <h2 className="mb-2 border-t border-border/60 pt-4 text-xs font-semibold uppercase text-muted-foreground/80">{label}</h2>;

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
        <nav aria-label="Menu ứng viên" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
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
        <div className="shrink-0 space-y-1 border-t border-border/50 p-3">
            <AvailabilityButton title="Cài đặt tài khoản" description="Trang cài đặt tài khoản đang được hoàn thiện." className={itemClass}>
                <Settings aria-hidden="true" className="size-4 shrink-0" />
                <span className={labelClass}>Cài đặt tài khoản</span>
            </AvailabilityButton>
            <AvailabilityButton title="Hỗ trợ" description="Khu vực hỗ trợ ứng viên đang được hoàn thiện." className={itemClass}>
                <CircleHelp aria-hidden="true" className="size-4 shrink-0" />
                <span className={labelClass}>Hỗ trợ</span>
            </AvailabilityButton>
        </div>
    </div>;
}
