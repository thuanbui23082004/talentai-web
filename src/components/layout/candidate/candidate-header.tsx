"use client";

import Link from "next/link";
import { Bell, ChevronDown, Menu, MessageCircle } from "lucide-react";
import { ModalTrigger } from "@/components/ui";
import { BrandLogo } from "@/components/shared/brand-logo";
import { NavigationDetails } from "@/components/shared/navigation-details";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { CandidateAccountMenu } from "./candidate-account-menu";
import type { AuthUser } from "@/features/auth";

export function CandidateHeader({ user }: { user: AuthUser }) {
    return <header className="sticky top-0 z-[45] h-16 bg-brand-deep text-white shadow-card">
        <div className="mx-auto flex h-full w-full items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
            <ModalTrigger type="button" aria-label="Mở menu ứng viên" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 lg:hidden"><Menu className="size-5" /></ModalTrigger>
            <Link href="/candidate/dashboard" aria-label="TalentAI — Không gian ứng viên"><BrandLogo light /></Link>
            <nav aria-label="Điều hướng ứng viên" className="hidden items-center gap-5 text-xs font-semibold lg:flex xl:gap-7">
                <NavigationDetails className="group relative"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">Việc làm<ChevronDown className="size-3 group-open:rotate-180" /></summary><div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-card p-2 text-foreground shadow-float"><Link href="/jobs" className="block rounded-lg px-3 py-3 hover:bg-secondary hover:text-primary">Tìm việc làm</Link><Link href="/candidate/applications" className="block rounded-lg px-3 py-3 hover:bg-secondary hover:text-primary">Việc làm đã ứng tuyển</Link></div></NavigationDetails>
                <NavigationDetails className="group relative"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">Công cụ<ChevronDown className="size-3 group-open:rotate-180" /></summary><div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-card p-2 text-foreground shadow-float"><Link href="/candidate/cv" className="block rounded-lg px-3 py-3 hover:bg-secondary hover:text-primary">CV của tôi</Link><Link href="/candidate/matching" className="block rounded-lg px-3 py-3 hover:bg-secondary hover:text-primary">AI Job Matching</Link></div></NavigationDetails>
                <Link href="/companies" className="flex min-h-11 items-center hover:text-white/80">Công ty</Link>
                <Link href="/#news" className="flex min-h-11 items-center hover:text-white/80">Cẩm nang nghề nghiệp</Link>
                <Link href="/#companies" className="hidden min-h-11 items-center hover:text-white/80 xl:flex">HR Nexus</Link>
            </nav>
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                <AvailabilityButton title="Tin nhắn" description="Khu vực tin nhắn đang được hoàn thiện." className="hidden size-9 items-center justify-center rounded-full bg-card text-primary hover:bg-secondary sm:flex"><MessageCircle aria-label="Tin nhắn" className="size-4" /></AvailabilityButton>
                <AvailabilityButton title="Thông báo" description="Khu vực thông báo đang được hoàn thiện." className="flex size-9 items-center justify-center rounded-full bg-card text-primary hover:bg-secondary"><Bell aria-label="Thông báo" className="size-4" /></AvailabilityButton>
                <CandidateAccountMenu user={user} />
            </div>
        </div>
    </header>;
}
