"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type RegistrationRole = "candidate" | "recruiter";
export function AuthRoleSwitch({
    value,
    onValueChange,
    disabled,
}: {
    value: RegistrationRole;
    onValueChange: (value: RegistrationRole) => void;
    disabled?: boolean;
}) {
    const name = useId();
    return (
        <fieldset
            disabled={disabled}
            className="flex rounded-xl bg-muted p-1 disabled:opacity-60"
        >
            <legend className="sr-only">Loại tài khoản</legend>
            {(
                [
                    { role: "candidate", label: "Ứng viên" },
                    { role: "recruiter", label: "Nhà tuyển dụng" },
                ] as const
            ).map((item) => (
                <label
                    key={item.role}
                    className={cn(
                        "relative flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-medium transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
                        value === item.role
                            ? "bg-card text-primary shadow-card"
                            : "text-muted-foreground",
                    )}
                >
                    <input
                        type="radio"
                        name={name}
                        value={item.role}
                        checked={value === item.role}
                        onChange={() => onValueChange(item.role)}
                        className="sr-only"
                    />
                    {item.label}
                </label>
            ))}
        </fieldset>
    );
}
