"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function AuthContent({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 if (pathname === "/register") return <div className="min-h-0 flex-1 overflow-hidden">{children}</div>;
 return <AuthScrollArea>{children}</AuthScrollArea>;
}

export function AuthScrollArea({ children }: { children: ReactNode }) {
    return (
        <div
            data-slot="auth-content"
            role="region"
            aria-label="Nội dung tài khoản"
            tabIndex={0}
            className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-6 pt-3 pb-8 [scroll-padding-block:1.5rem] sm:px-12 lg:px-14 lg:[scrollbar-gutter:stable_both-edges]"
            onFocusCapture={(event) => {
                const target = event.target;
                if (target === event.currentTarget) return;
                const field = target.closest('[data-slot="form-field"]') ?? target;
                // Run after native focus scrolling so the label and full control
                // remain visible when tabbing or focusing a validation error.
                requestAnimationFrame(() => {
                    if (field.isConnected) field.scrollIntoView({ block: "nearest", inline: "nearest" });
                });
            }}
        >
            <div className="mx-auto w-full max-w-[420px]">{children}</div>
        </div>
    );
}
