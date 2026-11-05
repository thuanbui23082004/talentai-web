"use client";

import "./cv-presentation.css";

import { useState } from "react";
import { ArrowRight, Palette, ScanText, Sparkles, WandSparkles } from "lucide-react";
import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";
import { Button, Modal, ModalContent } from "@/components/ui";
import { useCvs } from "../hooks/use-cvs";
import { CvUploadPanel } from "./cv-upload-panel";
import { UploadedCvs } from "./uploaded-cvs";
import { CvTemplateStudio } from "./cv-template-studio";

export function CvManagementPage({ userId }: { userId: string }) {
    const query = useCvs(userId);
    const [notice, setNotice] = useState("");
    const library = () => document.getElementById("cv-template-library")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });

    return <div className="candidate-page space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><CandidatePageTitle>Quản lý CV & Mẫu CV</CandidatePageTitle><p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">Quản lý hồ sơ ứng tuyển và chọn CV phù hợp cho cơ hội tiếp theo.</p></div>
            <div aria-label="Thống kê CV" className="w-fit rounded-xl border border-border bg-card px-6 py-3 text-center shadow-card"><p className="text-xs text-muted-foreground">CV đã tải lên</p><p className="mt-1 text-lg font-semibold text-primary">{query.isSuccess ? query.data.length : "—"}</p></div>
        </header>

        <section aria-label="AI Resume Studio Toolkit" className="cv-toolkit flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/35 p-4 sm:p-5">
            <div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Sparkles className="size-5" aria-hidden="true" /></span><div><h2 className="text-sm font-bold">AI Resume Studio Toolkit</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Bộ công cụ nâng cấp chất lượng CV, hướng đến bố cục rõ ràng và chuyên nghiệp.</p></div></div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button variant="outline" size="sm" className="max-sm:h-11" onClick={() => setNotice("Chấm điểm ATS với AI")}><ScanText />Chấm điểm ATS với AI</Button><Button variant="outline" size="sm" className="max-sm:h-11" onClick={() => setNotice("Tối ưu theo JD việc làm")}><WandSparkles />Tối ưu theo JD việc làm</Button></div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
            <CvUploadPanel userId={userId} />
            <section aria-labelledby="cv-create-heading" className="flex flex-col rounded-2xl border border-primary/25 bg-card p-5 shadow-card">
                <div className="flex gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Palette className="size-5" aria-hidden="true" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 id="cv-create-heading" className="text-sm font-semibold">Tạo CV mới từ mẫu</h2><span className="rounded-full bg-secondary px-2 py-1 text-xs text-primary">6 mẫu nổi bật</span></div><p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">Thử bố cục CV và chỉnh sửa bản nháp trước khi hoàn thiện hồ sơ.</p></div></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2"><p className="text-xs text-muted-foreground">Bản nháp từ mẫu chưa được lưu vào tài khoản.</p><button type="button" onClick={library} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary">Khám phá mẫu ngay <ArrowRight className="size-3.5" aria-hidden="true" /></button></div>
            </section>
        </div>

        <UploadedCvs userId={userId} />
        <CvTemplateStudio />
        <Modal open={!!notice} onOpenChange={open => { if (!open) setNotice(""); }}><ModalContent title={notice || "Công cụ AI"} description="Công cụ AI cho CV đang được phát triển." footer={<Button variant="outline" onClick={() => setNotice("")}>Đã hiểu</Button>} /></Modal>
    </div>;
}
