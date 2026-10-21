import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthContent } from "./auth-content";

export function AuthFrame({ children }: { children: ReactNode }) {
    return (
        <main className="flex h-dvh items-center justify-center overflow-hidden bg-muted p-3 sm:p-6 lg:p-8">
            <div
                data-slot="auth-frame"
                className="grid h-full min-h-0 w-full max-w-[1120px] overflow-hidden rounded-[20px] bg-card shadow-card lg:grid-cols-2"
            >
                <aside
                    data-slot="auth-illustration"
                    aria-hidden="true"
                    className="relative hidden min-h-0 overflow-hidden bg-secondary/65 lg:block"
                >
                    {/* The 759px source has a 29px transparent right edge.
                        A uniform overscan fills that edge without stretching the artwork. */}
                    <Image
                        src="/images/auth/login-banner.png"
                        alt=""
                        fill
                        sizes="(min-width: 1184px) 560px, (min-width: 1024px) 50vw, 1px"
                        className="origin-left scale-[1.042] object-cover object-center"
                        priority
                    />
                </aside>
                <section className="flex min-h-0 min-w-0 flex-col justify-center overflow-hidden">
                    <div className="shrink-0 bg-card px-6 pt-6 pb-4 sm:px-12 sm:pt-8 lg:px-14">
                        <div className="mx-auto w-full max-w-[420px]">
                            <Link
                                href="/"
                                aria-label="TalentAI — Trang chủ"
                                className="relative block h-11 w-40 overflow-hidden"
                            >
                                <Image
                                    src="/logo/image 1.png"
                                    alt="TalentAI"
                                    width={488}
                                    height={490}
                                    className="absolute top-1/2 left-0 h-auto w-40 -translate-y-1/2"
                                    priority
                                />
                            </Link>
                        </div>
                    </div>
                    <AuthContent>{children}</AuthContent>
                </section>
            </div>
        </main>
    );
}
