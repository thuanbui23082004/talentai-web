"use client";

import { useState, type ReactNode } from "react";
import { Modal, ModalContent } from "@/components/ui";
import type { AuthUser } from "@/features/auth";
import { CandidateHeader } from "./candidate-header";
import { CandidateSidebar } from "./candidate-sidebar";

export function CandidateShell({ user, children }: { user: AuthUser; children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    return <div className="min-h-dvh bg-background">
        <a href="#candidate-content" className="sr-only fixed top-2 left-2 z-[100] rounded-lg bg-card p-3 text-primary focus:not-sr-only">Chuyển đến nội dung chính</a>
        <Modal open={mobileOpen} onOpenChange={setMobileOpen}>
            <CandidateHeader user={user} />
            <div className="flex min-h-[calc(100dvh-4rem)] items-start">
                <aside aria-label="Thanh bên ứng viên" className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 border-r border-border/50 lg:block"><CandidateSidebar /></aside>
                <main id="candidate-content" tabIndex={-1} className="min-h-[calc(100dvh-4rem)] min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8">{children}</main>
            </div>
            <ModalContent title="Menu ứng viên" className="top-0 left-0 h-dvh max-h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 rounded-none p-4 [&>div.mt-6]:h-[calc(100%-4rem)] [&>div.mt-6]:mt-4"><CandidateSidebar onNavigate={() => setMobileOpen(false)} /></ModalContent>
        </Modal>
    </div>;
}
