import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import lostMascot from "../../../public/images/states/mascot-not-found.webp";
import emptyMascot from "../../../public/images/states/mascot-empty.webp";
import errorMascot from "../../../public/images/states/mascot-error.webp";

const illustrations = { "not-found": lostMascot, empty: emptyMascot, error: errorMascot };

export type FeedbackStateProps = {
    kind?: keyof typeof illustrations;
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    code?: string;
    variant?: "section" | "page" | "compact";
    headingAs?: "h1" | "h2" | "h3";
    className?: string;
};

/** Clear recovery actions remain primary; artwork is purely decorative. */
export function FeedbackState({ kind = "empty", title, description, action, icon, code, variant = "section", headingAs = "h2", className }: FeedbackStateProps) {
    const Heading = headingAs;
    const page = variant === "page";
    const compact = variant === "compact";
    return <div data-feedback-state={kind} role={kind === "error" ? "alert" : undefined} className={cn(
        "flex flex-col items-center text-center",
        page ? "min-h-[min(34rem,calc(100dvh-10rem))] justify-center px-5 py-10 sm:py-12" : compact ? "rounded-xl bg-card px-4 py-5" : "rounded-2xl border border-border/70 bg-card px-5 py-8 sm:px-8",
        className,
    )}>
        <div aria-hidden="true" data-feedback-illustration={kind} className={cn("relative isolate mb-4 shrink-0", page ? "size-56 sm:size-64" : compact ? "size-24" : "size-36")}>
            <span className="absolute inset-[14%] -z-10 rounded-full bg-secondary/40" />
            <Image src={illustrations[kind]} alt="" width={640} height={640} loading={page ? "eager" : "lazy"} sizes={page ? "(min-width: 640px) 256px, 224px" : compact ? "96px" : "144px"} className="feedback-mascot h-full w-full object-contain" />
            {icon && <span className="absolute right-0 bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-card [&_svg]:size-4">{icon}</span>}
        </div>
        {code && <p className="mb-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-widest text-primary">{code}</p>}
        <Heading className={cn("max-w-xl text-foreground", page ? "text-2xl leading-tight font-bold tracking-tight sm:text-3xl" : compact ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</Heading>
        {description && <p className={cn("mt-2 max-w-md text-pretty text-muted-foreground", compact ? "text-xs leading-5" : "text-sm leading-6")}>{description}</p>}
        {action && <div className={cn("flex max-w-full flex-wrap items-center justify-center gap-3", compact ? "mt-4" : "mt-5")}>{action}</div>}
    </div>;
}
