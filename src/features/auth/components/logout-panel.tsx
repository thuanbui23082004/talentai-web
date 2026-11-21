"use client";

import { useEffect, useRef } from "react";
import { Alert, Button } from "@/components/ui";
import { useLogout } from "../hooks/use-auth";

// Keep the old /logout URL working without showing a confirmation page.
export function LogoutPanel() {
    const mutation = useLogout();
    const started = useRef(false);
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        mutation.mutate();
    }, [mutation]);

    return (
        <div role="status" className="space-y-5">
            <h1 className="text-2xl font-bold tracking-tight">Đang đăng xuất…</h1>
            {mutation.isError && (
                <>
                    <Alert variant="error" title="Chưa thể đăng xuất">Phiên của bạn chưa được kết thúc. Vui lòng thử lại.</Alert>
                    <Button className="w-full" onClick={() => mutation.mutate()} loading={mutation.isPending}>Thử lại</Button>
                </>
            )}
        </div>
    );
}
