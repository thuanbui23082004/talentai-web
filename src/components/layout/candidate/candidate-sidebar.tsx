"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleHelp, ContactRound, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { NavigationDetails } from "@/components/shared/navigation-details";
import { candidateNavigation, candidateProfileNavigation, candidateSavedJobs } from "./candidate-navigation";

const menuClass = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition hover:bg-secondary/60 hover:text-primary";

export function CandidateSidebar({ onNavigate, collapsed = false, onToggleCollapse }: { onNavigate?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
    const pathname = usePathname();
    const [profileOpen, setProfileOpen] = useState(candidateProfileNavigation.some((item) => pathname === item.href));
    const SavedIcon = candidateSavedJobs.Icon;
    const itemClass = `${menuClass} ${collapsed ? "justify-center" : ""}`;
    const labelClass = collapsed ? "sr-only" : "";
    const link = ({ href, label, Icon }: typeof candidateNavigation[number]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`${itemClass} ${active ? "bg-secondary/80 text-primary" : "text-foreground"}`}><Icon aria-hidden="true" className="size-4 shrink-0" /><span className={labelClass}>{label}</span></Link>;
    };
    return <div className="flex h-full min-h-0 flex-col bg-card">
        {onToggleCollapse && <div className="shrink-0 border-b border-border/50 p-3"><button type="button" onClick={onToggleCollapse} aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"} aria-expanded={!collapsed} aria-controls="candidate-desktop-sidebar" title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"} className={`${itemClass} text-muted-foreground`}>{collapsed ? <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" /> : <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />}<span className={labelClass}>Thu gọn menu</span></button></div>}
        <nav aria-label="Menu ứng viên" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
            {link(candidateNavigation[0])}
            {collapsed ? <button type="button" title="Hồ sơ việc làm" aria-label="Hồ sơ việc làm" onClick={() => { setProfileOpen(true); onToggleCollapse?.(); }} className={itemClass}><ContactRound aria-hidden="true" className="size-4 shrink-0" /></button> : <NavigationDetails closeOnNavigate={false} open={profileOpen} onToggle={(event) => setProfileOpen(event.currentTarget.open)} className="group"><summary className={`${menuClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}><ContactRound aria-hidden="true" className="size-4 shrink-0" /><span className="flex-1">Hồ sơ việc làm</span><ChevronDown className="size-3.5 text-muted-foreground group-open:rotate-180" /></summary><div className="mt-1 space-y-1 border-l border-border pl-2 ml-5">{candidateProfileNavigation.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={onNavigate} className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-xs hover:bg-secondary hover:text-primary ${pathname === item.href ? "bg-secondary/80 font-medium text-primary" : "text-muted-foreground"}`}>{item.label}</Link>)}</div></NavigationDetails>}
            {candidateNavigation.slice(1).map(link)}
            <AvailabilityButton title={candidateSavedJobs.label} description="Trang việc làm đã lưu đang được hoàn thiện." className={itemClass}><span title={collapsed ? candidateSavedJobs.label : undefined}><SavedIcon aria-hidden="true" className="size-4 shrink-0" /></span><span className={labelClass}>{candidateSavedJobs.label}</span></AvailabilityButton>
            <div className="space-y-1 border-t border-border/50 pt-3 mt-4 lg:hidden"><Link href="/jobs" onClick={onNavigate} className={menuClass}>Tìm việc làm</Link><Link href="/companies" onClick={onNavigate} className={menuClass}>Khám phá công ty</Link></div>
        </nav>
        <div className="shrink-0 space-y-1 border-t border-border/50 p-3">
            <AvailabilityButton title="Cài đặt tài khoản" description="Trang cài đặt tài khoản đang được hoàn thiện." className={itemClass}><span title={collapsed ? "Cài đặt tài khoản" : undefined}><Settings aria-hidden="true" className="size-4 shrink-0" /></span><span className={labelClass}>Cài đặt tài khoản</span></AvailabilityButton>
            <AvailabilityButton title="Hỗ trợ" description="Khu vực hỗ trợ ứng viên đang được hoàn thiện." className={itemClass}><span title={collapsed ? "Hỗ trợ" : undefined}><CircleHelp aria-hidden="true" className="size-4 shrink-0" /></span><span className={labelClass}>Hỗ trợ</span></AvailabilityButton>
        </div>
    </div>;
}
