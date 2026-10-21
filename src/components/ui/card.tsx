import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            {...props}
            className={cn(
                "rounded-2xl border border-border bg-card text-card-foreground shadow-card",
                className,
            )}
        />
    );
}
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            {...props}
            className={cn("space-y-1.5 p-5 pb-0 sm:p-6 sm:pb-0", className)}
        />
    );
}
export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
    return (
        <h3
            {...props}
            className={cn("text-base font-semibold tracking-tight", className)}
        />
    );
}
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
    return (
        <p
            {...props}
            className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                className,
            )}
        />
    );
}
export function CardContent({ className, ...props }: ComponentProps<"div">) {
    return <div {...props} className={cn("p-5 sm:p-6", className)} />;
}
export function CardFooter({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            {...props}
            className={cn(
                "flex flex-wrap items-center gap-3 px-5 pb-5 sm:px-6 sm:pb-6",
                className,
            )}
        />
    );
}
