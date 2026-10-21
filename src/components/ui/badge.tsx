import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const styles = {
    default: "bg-secondary text-primary",
    hot: "bg-warning-soft text-warning-foreground",
    new: "bg-success-soft text-success-foreground",
    remote: "bg-info-soft text-info-foreground",
    outline: "border-border bg-card text-muted-foreground",
    neutral: "bg-muted text-muted-foreground",
};
export function Badge({
    variant = "default",
    className,
    ...props
}: ComponentProps<"span"> & { variant?: keyof typeof styles }) {
    return (
        <span
            {...props}
            className={cn(
                "inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] leading-none font-semibold [&_svg]:size-3",
                styles[variant],
                className,
            )}
        />
    );
}
