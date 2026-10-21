"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type RadioOption = {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
};
export function RadioGroup({
    label,
    options,
    name,
    value,
    defaultValue,
    onValueChange,
    disabled,
    className,
}: {
    label: string;
    options: RadioOption[];
    name?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
}) {
    const id = useId();
    return (
        <fieldset disabled={disabled} className={cn("space-y-3", className)}>
            <legend className="ui-label mb-3">{label}</legend>
            {options.map((option) => (
                <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50"
                >
                    <input
                        type="radio"
                        name={name ?? id}
                        value={option.value}
                        checked={
                            value === undefined
                                ? undefined
                                : value === option.value
                        }
                        defaultChecked={
                            value === undefined
                                ? defaultValue === option.value
                                : undefined
                        }
                        onChange={() => onValueChange?.(option.value)}
                        disabled={option.disabled}
                        className="ui-choice mt-0.5"
                    />
                    <span>
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                                {option.description}
                            </span>
                        )}
                    </span>
                </label>
            ))}
        </fieldset>
    );
}
