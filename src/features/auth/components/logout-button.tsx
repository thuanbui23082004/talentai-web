"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { useLogout } from "../hooks/use-auth";

export function LogoutButton({ children, className, variant = "ghost" }: {
    children: ReactNode;
    className?: string;
    variant?: "ghost" | "outline";
}) {
    const mutation = useLogout();
    return (
        <>
            <Button
                type="button"
                variant={variant}
                className={className}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
            >
                {children}
            </Button>
            {mutation.isError && (
                <p role="alert" className="px-3 text-xs text-destructive">
                    Chưa thể đăng xuất. Vui lòng thử lại.
                </p>
            )}
        </>
    );
}
