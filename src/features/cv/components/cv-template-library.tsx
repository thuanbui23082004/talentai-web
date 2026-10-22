"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { CV_CATEGORIES, CV_TEMPLATES, type CvCategory, type CvDesign } from "../presentation";
import { ResumePaper } from "./resume-paper";

export function CvTemplateLibrary({ onChoose }: { onChoose: (design: CvDesign) => void }) {
    const [category, setCategory] = useState<CvCategory>("Tất cả mẫu");
    const [sort, setSort] = useState("popular");
    const templates = CV_TEMPLATES.filter((item) => category === "Tất cả mẫu" || item.category === category).toSorted((a, b) => sort === "name" ? a.name.localeCompare(b.name, "vi") : b.popular - a.popular);
    return <section id="cv-template-library" aria-labelledby="cv-template-heading" className="scroll-mt-24 space-y-6 pt-5">
        <div className="cv-library-hero relative isolate overflow-hidden rounded-2xl px-6 py-7 text-white sm:px-8">
            <div className="relative z-10 max-w-xl sm:pr-36"><span className="mb-3 inline-flex items-center gap-1 text-xs font-semibold"><Sparkles className="size-4" aria-hidden="true" />TalentAI</span><h2 id="cv-template-heading" className="text-xl font-bold tracking-tight sm:text-2xl">Tạo CV chuyên nghiệp với Mẫu thịnh hành</h2><p className="mt-2 text-xs leading-6 text-white/85 sm:text-sm">Các mẫu CV được thiết kế khoa học giúp bạn trình bày năng lực rõ ràng và gây ấn tượng với nhà tuyển dụng ngay từ cái nhìn đầu tiên.</p></div>
            <Image src="/images/image 16.png" alt="" width={599} height={695} className="pointer-events-none absolute right-4 bottom-0 hidden h-44 w-36 object-contain sm:block lg:right-12" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div role="group" aria-label="Danh mục mẫu CV" className="flex flex-wrap gap-1">{CV_CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-11 rounded-lg px-3 text-xs font-medium transition-colors ${category === item ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-primary"}`}>{item}</button>)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Sắp xếp theo:</span><Select aria-label="Sắp xếp mẫu CV" value={sort} onValueChange={(value) => setSort(value ?? "popular")} options={[{ value: "popular", label: "Được dùng nhiều nhất" }, { value: "name", label: "Tên mẫu A – Z" }]} className="h-9 w-45 text-xs" /></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <article key={template.id} aria-label={template.name} className="group min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow hover:shadow-float">
            <div className="cv-paper-frame cv-template-preview relative overflow-hidden border-b border-border/60"><ResumePaper design={template.id} person={template.person} /><span className={`absolute top-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${template.id === "executive" || template.id === "classic" ? "bg-primary text-white" : "bg-card/95 text-foreground shadow-card"}`}><Sparkles className="size-3" aria-hidden="true" />{template.badge}</span></div>
            <div className="p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{template.name}</h3><span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" /></div><p className="mt-2 min-h-15 text-xs leading-5 text-muted-foreground">{template.description}</p><Button variant="secondary" className="mt-3 w-full text-xs" onClick={() => onChoose(template.id)}>Dùng mẫu này <ArrowRight className="size-3.5" aria-hidden="true" /></Button></div>
        </article>)}</div>
    </section>;
}
