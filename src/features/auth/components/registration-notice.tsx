"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

export function RegistrationNotice() {
    const { toast } = useToast();
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get("registered") !== "1") return;
        url.searchParams.delete("registered");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        // The shared ToastProvider already uses a 5-second timeout.
        toast({ title: "Đăng ký thành công", description: "Bạn đã đăng nhập. Chào mừng bạn đến với TalentAI!", variant: "success" });
    }, [toast]);
    return null;
}
