import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { FeedbackState, type FeedbackStateProps } from "./feedback-state";

/** Standalone recovery shell for routes that do not have a public/candidate layout. */
export function FeedbackPage(props: Omit<FeedbackStateProps, "variant" | "headingAs">) {
    return <main className="flex min-h-dvh flex-col bg-background">
        <div className="ui-container flex min-h-20 items-center justify-between gap-4 py-4">
            <Link href="/" aria-label="TalentAI — Trang chủ"><BrandLogo /></Link>
            <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary hover:underline sm:text-sm">Khám phá việc làm<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <div className="ui-container flex flex-1 items-center justify-center py-4"><FeedbackState {...props} variant="page" headingAs="h1" className="w-full" /></div>
        <p className="px-5 py-5 text-center text-xs text-muted-foreground">TalentAI · Luôn có một lối đi tiếp theo.</p>
    </main>;
}
