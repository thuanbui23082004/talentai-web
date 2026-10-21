"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleHelp, ContactRound, Settings } from "lucide-react";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { NavigationDetails } from "@/components/shared/navigation-details";
import { candidateNavigation, candidateSavedJobs } from "./candidate-navigation";

const menuClass = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition hover:bg-secondary/60 hover:text-primary";

export function CandidateSidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const SavedIcon = candidateSavedJobs.Icon;
    const link = ({ href, label, Icon }: typeof candidateNavigation[number]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`${menuClass} ${active ? "bg-secondary/80 text-primary" : "text-foreground"}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</Link>;
    };
    return <div className="flex h-full min-h-0 flex-col bg-card">
        <nav aria-label="Menu ứng viên" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
            {link(candidateNavigation[0])}
            <NavigationDetails className="group"><summary className={`${menuClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}><ContactRound aria-hidden="true" className="size-4 shrink-0" /><span className="flex-1">Hồ sơ việc làm</span><ChevronDown className="size-3.5 text-muted-foreground group-open:rotate-180" /></summary><div className="mt-1 space-y-1 border-l border-border pl-2 ml-5">{["Hồ sơ cá nhân", "Học vấn và kinh nghiệm"].map((label) => <AvailabilityButton key={label} title={label} description="Nội dung hồ sơ đang được hoàn thiện. Bạn có thể quản lý CV trong mục CV của tôi." className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-primary">{label}</AvailabilityButton>)}</div></NavigationDetails>
            {candidateNavigation.slice(1).map(link)}
            <AvailabilityButton title={candidateSavedJobs.label} description="Trang việc làm đã lưu đang được hoàn thiện." className={menuClass}><SavedIcon aria-hidden="true" className="size-4 shrink-0" />{candidateSavedJobs.label}</AvailabilityButton>
            <div className="space-y-1 border-t border-border/50 pt-3 mt-4 lg:hidden"><Link href="/jobs" onClick={onNavigate} className={menuClass}>Tìm việc làm</Link><Link href="/companies" onClick={onNavigate} className={menuClass}>Khám phá công ty</Link></div>
        </nav>
        <div className="shrink-0 space-y-1 border-t border-border/50 p-3">
            <AvailabilityButton title="Cài đặt tài khoản" description="Trang cài đặt tài khoản đang được hoàn thiện." className={menuClass}><Settings aria-hidden="true" className="size-4 shrink-0" />Cài đặt tài khoản</AvailabilityButton>
            <AvailabilityButton title="Hỗ trợ" description="Khu vực hỗ trợ ứng viên đang được hoàn thiện." className={menuClass}><CircleHelp aria-hidden="true" className="size-4 shrink-0" />Hỗ trợ</AvailabilityButton>
        </div>
    </div>;
}
