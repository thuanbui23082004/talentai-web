"use client";

import { Avatar as Primitive } from "@base-ui/react/avatar";
import { cn } from "@/lib/utils";

export function Avatar({
    name,
    src,
    size = "md",
    className,
}: {
    name: string;
    src?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const initials =
        name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((word) => Array.from(word)[0])
            .join("")
            .toLocaleUpperCase("vi") || "?";
    return (
        <Primitive.Root
            className={cn(
                "relative inline-flex shrink-0 overflow-hidden rounded-full bg-secondary font-semibold text-primary ring-2 ring-white",
                {
                    sm: "size-8 text-xs",
                    md: "size-11 text-sm",
                    lg: "size-14 text-lg",
                }[size],
                className,
            )}
        >
            <Primitive.Image
                src={src}
                alt={name}
                className="size-full object-cover"
            />
            <Primitive.Fallback
                className="flex size-full items-center justify-center"
                role="img"
                aria-label={name}
            >
                {initials}
            </Primitive.Fallback>
        </Primitive.Root>
    );
}
