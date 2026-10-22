import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function CandidatePageTitle({ className, ...props }: ComponentProps<"h1">) {
    return <h1 {...props} className={cn("text-2xl font-bold tracking-tight text-foreground", className)} />;
}
