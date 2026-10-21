"use client";

import Link from "next/link";
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
        <span className="inline-flex items-center gap-3 text-xs font-semibold">
            <Link href={`/${user.role}/dashboard`} className="hover:underline">
                Tài khoản của tôi
            </Link>
            <span className="text-white/35">/</span>
            <Link href="/logout" className="hover:underline">
                Đăng xuất
            </Link>
        </span>
    );
}
