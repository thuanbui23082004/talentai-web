"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui";

export function JobShare({ title }: { title: string }) {
    const [message, setMessage] = useState("");
    const share = async () => {
        try {
            if (navigator.share) await navigator.share({ title, url: window.location.href });
            else { await navigator.clipboard.writeText(window.location.href); setMessage("Đã sao chép liên kết."); }
        } catch { setMessage("Bạn có thể sao chép địa chỉ trang để chia sẻ."); }
    };
    return <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5"><span className="font-semibold">Chia sẻ công việc:</span><Button variant="outline" size="sm" onClick={share}><Share2 className="size-4" />Chia sẻ</Button><Button variant="ghost" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setMessage("Đã sao chép liên kết."); } catch { setMessage("Bạn có thể sao chép địa chỉ trang để chia sẻ."); } }}><Copy className="size-4" />Sao chép liên kết</Button><span role="status" className="text-xs text-muted-foreground">{message}</span></div>;
}
