"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({
    label,
    description,
    className,
    id: providedId,
    ...props
}: Omit<ComponentProps<"input">, "type"> & {
    label: ReactNode;
    description?: string;
}) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    return (
        <label
            htmlFor={id}
            className={cn(
                "flex cursor-pointer items-start gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50",
                className,
            )}
        >
            <input
                {...props}
                id={id}
                type="checkbox"
                className="ui-choice mt-0.5 rounded"
            />
            <span>
                <span className="font-medium">{label}</span>
                {description && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
        </label>
    );
}
