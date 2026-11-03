"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "../hooks/use-session";

export function AccountLinks() {
    const { user, isPending } = useSession();
    if (isPending)
        return (
            <span
                className="block h-4 w-28 animate-pulse rounded bg-white/15"
                aria-label="Đang tải tài khoản"
            />
        );
    if (!user)
        return (
            <Link
                href="/login"
                className="text-xs font-semibold hover:underline"
            >
                Đăng ký / Đăng nhập
            </Link>
        );
    return (
        <Link
            href={`/${user.role}/dashboard`}
            aria-label={`Tài khoản của ${user.fullName}`}
            title={`${user.fullName} · ${user.email}`}
            className="flex min-h-11 max-w-52 items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
            <span aria-hidden="true"><Avatar name={user.fullName} src={user.avatarUrl} size="sm" /></span>
            <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{user.fullName}</span>
                <span className="block truncate text-[11px] font-normal text-white/70">{user.email}</span>
            </span>
        </Link>
    );
}
