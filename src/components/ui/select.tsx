"use client";

import { Select as Primitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectProps = Omit<
    Primitive.Root.Props<string>,
    "children" | "items" | "multiple"
> & {
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
};

export function Select({
    options,
    placeholder = "Chọn một giá trị",
    className,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    ...props
}: SelectProps) {
    return (
        <Primitive.Root {...props} items={options}>
            <Primitive.Trigger
                aria-label={label}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={cn(
                    "ui-input flex items-center justify-between gap-3 text-left data-placeholder:text-muted-foreground",
                    className,
                )}
            >
                <Primitive.Value placeholder={placeholder} />
                <Primitive.Icon>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </Primitive.Icon>
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
                                    key={option.value}
                                    value={option.value}
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
    );
}
