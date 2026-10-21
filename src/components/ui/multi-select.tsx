"use client";

import { Select as Primitive } from "@base-ui/react/select";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./select";

export type MultiSelectProps = {
    options: SelectOption[];
    value: string[];
    onValueChange: (value: string[]) => void;
    label: string;
    placeholder?: string;
    name?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
};
export function MultiSelect({
    options,
    value,
    onValueChange,
    label,
    placeholder = "Chọn một hoặc nhiều giá trị",
    className,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    ...props
}: MultiSelectProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <Primitive.Root
                {...props}
                multiple
                items={options}
                value={value}
                onValueChange={onValueChange}
            >
                <Primitive.Trigger
                    aria-label={label}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className="ui-input flex items-center justify-between gap-3 text-left"
                >
                    <span
                        className={
                            value.length
                                ? "truncate"
                                : "truncate text-muted-foreground"
                        }
                    >
                        {value.length ? `${value.length} đã chọn` : placeholder}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </Primitive.Trigger>
                <Primitive.Portal>
                    <Primitive.Positioner
                        sideOffset={6}
                        align="start"
                        alignItemWithTrigger={false}
                        className="z-50"
                    >
                        <Primitive.Popup className="ui-popup min-w-[var(--anchor-width)] overflow-y-auto">
                            <Primitive.List>
                                {options.map((option) => (
                                    <Primitive.Item
                                        value={option.value}
                                        key={option.value}
                                        disabled={option.disabled}
                                        className="ui-option"
                                    >
                                        <Primitive.ItemText>
                                            {option.label}
                                        </Primitive.ItemText>
                                        <Primitive.ItemIndicator className="absolute right-3 text-primary">
                                            <Check className="size-4" />
                                        </Primitive.ItemIndicator>
                                    </Primitive.Item>
                                ))}
                            </Primitive.List>
                        </Primitive.Popup>
                    </Primitive.Positioner>
                </Primitive.Portal>
            </Primitive.Root>
            {value.length > 0 && (
                <ul
                    className="flex flex-wrap gap-1.5"
                    aria-label={`${label} đã chọn`}
                >
                    {value.map((item) => (
                        <li
                            key={item}
                            className="inline-flex items-center gap-1 rounded-lg bg-secondary py-1 pr-1 pl-2 text-xs font-medium text-primary"
                        >
                            {options.find((option) => option.value === item)
                                ?.label ?? item}
                            <button
                                type="button"
                                disabled={props.disabled}
                                onClick={() =>
                                    onValueChange(
                                        value.filter(
                                            (selected) => selected !== item,
                                        ),
                                    )
                                }
                                aria-label={`Bỏ ${options.find((option) => option.value === item)?.label ?? item}`}
                                className="flex size-6 items-center justify-center rounded-md hover:bg-secondary-hover disabled:opacity-50"
                            >
                                <X className="size-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
