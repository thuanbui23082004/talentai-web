"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { SocialBrandIcon } from "@/components/shared/social-brand-icon";

function subscribeUrl(callback: () => void) {
    window.addEventListener("popstate", callback);
    return () => window.removeEventListener("popstate", callback);
}

export function CompanyShare({ name, compact = false }: { name: string; compact?: boolean }) {
    const url = useSyncExternalStore(subscribeUrl, () => window.location.href, () => "");
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState("");
    const copy = async () => {
        try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setMessage("Đã sao chép liên kết công ty."); }
        catch { setMessage("Bạn có thể sao chép địa chỉ trang để chia sẻ."); }
    };
    const share = async () => {
        if (!navigator.share) return copy();
        try { await navigator.share({ title: name, url: window.location.href }); }
        catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Bạn có thể sao chép địa chỉ trang để chia sẻ."); }
    };
    if (compact) return <div><Button variant="outline" onClick={share} className="w-full border-primary/20 px-6 text-primary"><Share2 className="size-4" />{copied ? "Đã sao chép" : "Chia sẻ"}</Button><span role="status" className="sr-only">{message}</span></div>;
    return <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-base font-bold">Chia sẻ công ty</h2><p className="mt-4 text-xs text-muted-foreground">Sao chép đường dẫn</p>
        <div className="mt-2 flex items-center overflow-hidden rounded-lg border border-border"><input aria-label="Liên kết công ty" readOnly value={url} className="h-11 min-w-0 flex-1 bg-transparent px-3 text-xs text-muted-foreground outline-none" onFocus={(event) => event.target.select()} /><Button variant="ghost" size="icon" aria-label="Sao chép liên kết công ty" onClick={copy}>{copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}</Button></div>
        <p className="mt-4 text-xs text-muted-foreground">Chia sẻ qua mạng xã hội</p><div className="mt-3 flex gap-3">{([{ label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` }, { label: "X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(name)}` }, { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` }] as const).map((item) => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`Chia sẻ qua ${item.label}`} className="flex size-11 items-center justify-center rounded-full border-2 border-border bg-card transition hover:border-primary/40 hover:bg-secondary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><SocialBrandIcon brand={item.label} /></a>)}</div><p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p>
    </section>;
}
