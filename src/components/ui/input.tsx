"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type InputProps = ComponentProps<"input"> & {
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
};

export function Input({
    className,
    type = "text",
    leadingIcon,
    trailingIcon,
    disabled,
    ...props
}: InputProps) {
    const [visible, setVisible] = useState(false);
    const password = type === "password";
    const icon =
        leadingIcon ??
        (type === "search" ? <Search aria-hidden="true" /> : undefined);
    return (
        <div
            className={cn("ui-input-wrap", disabled && "opacity-50", className)}
        >
            {icon && <span className="ui-input-icon">{icon}</span>}
            <input
                {...props}
                disabled={disabled}
                type={password && visible ? "text" : type}
                className={cn(
                    "ui-input",
                    icon && "pl-11",
                    (password || trailingIcon) && "pr-11",
                )}
            />
            {password ? (
                <button
                    type="button"
                    className="ui-input-action"
                    disabled={disabled}
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                >
                    {visible ? <EyeOff /> : <Eye />}
                </button>
            ) : (
                trailingIcon && (
                    <span className="ui-input-icon right-3! left-auto!">
                        {trailingIcon}
                    </span>
                )
            )}
        </div>
    );
}
