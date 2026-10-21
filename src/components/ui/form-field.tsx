"use client";

import { useId, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldControl = {
    id: string;
    required?: boolean;
    "aria-describedby"?: string;
    "aria-invalid": boolean;
};

export function FormField({
    label,
    description,
    error,
    required,
    id: providedId,
    children,
    className,
}: {
    label: ReactNode;
    description?: string;
    error?: string;
    required?: boolean;
    id?: string;
    children: (props: FieldControl) => ReactNode;
    className?: string;
}) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const helpId = `${id}-help`;
    return (
        <div data-slot="form-field" className={cn("space-y-2", className)}>
            <label htmlFor={id} className="ui-label">
                {label}
                {required && (
                    <span
                        className="ml-1 text-destructive"
                        aria-label="bắt buộc"
                    >
                        *
                    </span>
                )}
            </label>
            {children({
                id,
                required,
                "aria-describedby": error || description ? helpId : undefined,
                "aria-invalid": !!error,
            })}
            {error ? (
                <p
                    id={helpId}
                    role="alert"
                    className="flex items-start gap-1.5 text-xs text-destructive"
                >
                    <CircleAlert
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden="true"
                    />
                    {error}
                </p>
            ) : (
                description && (
                    <p
                        id={helpId}
                        className="text-xs leading-relaxed text-muted-foreground"
                    >
                        {description}
                    </p>
                )
            )}
        </div>
    );
}
