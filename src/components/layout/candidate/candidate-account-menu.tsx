"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui";
import { NavigationDetails } from "@/components/shared/navigation-details";
import { AvailabilityButton } from "@/components/shared/availability-button";
import type { AuthUser } from "@/features/auth";

export function CandidateAccountMenu({ user }: { user: AuthUser }) {
    return <NavigationDetails className="group relative">
        <summary aria-label={`Tài khoản ${user.fullName}`} className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-1 text-sm font-semibold [&::-webkit-details-marker]:hidden"><Avatar name={user.fullName} src={user.avatarUrl} size="sm" /><span className="hidden max-w-40 truncate md:block">{user.fullName}</span><ChevronDown aria-hidden="true" className="size-3.5 group-open:rotate-180" /></summary>
        <div className="absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-2 text-foreground shadow-float">
            <div className="border-b border-border px-3 py-3"><p className="truncate text-sm font-semibold">{user.fullName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p><p className="mt-1 text-xs text-primary">Tài khoản ứng viên</p></div>
            <Link href="/candidate/dashboard" className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary hover:text-primary"><LayoutDashboard className="size-4" />Tổng quan</Link>
            <AvailabilityButton title="Cài đặt tài khoản" description="Trang cài đặt tài khoản đang được hoàn thiện." className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-secondary hover:text-primary"><Settings className="size-4" />Cài đặt tài khoản</AvailabilityButton>
            <Link href="/logout" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary hover:text-primary"><LogOut className="size-4" />Đăng xuất</Link>
        </div>
    </NavigationDetails>;
}
