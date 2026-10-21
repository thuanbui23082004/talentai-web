"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function CompanyIntroduction({ name, description }: { name: string; description?: string }) {
    const [expanded, setExpanded] = useState(false);
    const canExpand = (description?.length ?? 0) > 420;
    return <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-base font-bold">Giới thiệu công ty {name}</h2>
        <div className={`mt-3 space-y-3 text-sm leading-7 text-muted-foreground ${canExpand && !expanded ? "line-clamp-6" : ""}`} id="company-introduction">
            {description ? description.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>Công ty chưa cập nhật thông tin giới thiệu.</p>}
        </div>
        {canExpand && <button type="button" aria-expanded={expanded} aria-controls="company-introduction" onClick={() => setExpanded(!expanded)} className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">{expanded ? "Thu gọn" : "Xem thêm"}<ChevronDown className={`size-4 ${expanded ? "rotate-180" : ""}`} /></button>}
    </section>;
}
