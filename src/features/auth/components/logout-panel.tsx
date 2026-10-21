"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { useLogout } from "../hooks/use-auth";

export function LogoutPanel({
    fullName,
    dashboard,
}: {
    fullName: string;
    dashboard: string;
}) {
    const mutation = useLogout();
    return (
        <div className="space-y-6">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <LogOut className="size-6" />
            </span>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Đăng xuất tài khoản
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Bạn đang đăng nhập với tên{" "}
                    <strong className="font-medium text-foreground">
                        {fullName}
                    </strong>
                    . Bạn có muốn kết thúc phiên làm việc này?
                </p>
            </div>
            {mutation.isError && (
                <Alert variant="error" title="Chưa thể đăng xuất">
                    {mutation.error.message} Bạn có thể thử lại.
                </Alert>
            )}
            <Button
                className="w-full"
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
            >
                {mutation.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
            </Button>
            <Button
                variant="outline"
                role="link"
                className="w-full"
                disabled={mutation.isPending}
                nativeButton={false}
                render={<Link href={dashboard} />}
            >
                Quay lại
            </Button>
        </div>
    );
}
