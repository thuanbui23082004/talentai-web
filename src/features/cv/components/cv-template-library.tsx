"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { CV_TEMPLATE_REGISTRY } from "../templates/registry";
import type { CVData } from "../types/cv";

const thumbnailData: CVData = {
    basics: { fullName: "Nguyễn Trúc Anh", title: "Chuyên viên kinh doanh", email: "ungvien@example.com", phone: "090 123 4567", address: "Hà Nội", avatarUrl: "", summary: "Chủ động học hỏi và phát triển chuyên môn để đóng góp cho tổ chức." },
    education: [{ school: "Đại học", degree: "Cử nhân", startDate: "2020", endDate: "2024", description: "" }],
    experience: [{ company: "Công ty ABC", position: "Chuyên viên", startDate: "2024", endDate: "", current: true, description: "Phối hợp cùng nhóm để hoàn thành các dự án." }],
    skills: [{ name: "Giao tiếp", level: 85 }, { name: "Làm việc nhóm", level: 80 }], projects: [], certificates: [], languages: [],
};

export function CvTemplateLibrary({ onChoose, disabled = false }: { onChoose: (templateId: string) => void; disabled?: boolean }) {
    return <section id="cv-template-library" aria-labelledby="cv-template-heading" className="scroll-mt-24 space-y-6 pt-5">
        <div className="rounded-2xl bg-primary px-6 py-7 text-white"><h2 id="cv-template-heading" className="text-xl font-bold">Chọn mẫu CV từ hồ sơ của bạn</h2><p className="mt-2 text-sm text-white/85">Chọn một mẫu để tự điền thông tin hồ sơ và chỉnh sửa trước khi lưu.</p></div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{CV_TEMPLATE_REGISTRY.map(template => <article key={template.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"><div className="relative h-72 overflow-hidden bg-muted"><div className="absolute top-0 left-1/2 w-[210mm] origin-top -translate-x-1/2 scale-[.34]"><template.component data={thumbnailData} theme="#EC8F00" background="none" /></div></div><div className="flex items-center justify-between gap-2 p-4"><h3 className="font-semibold">{template.name}</h3><Button variant="secondary" disabled={disabled} onClick={() => onChoose(template.id)}>Dùng mẫu <ArrowRight className="size-4" /></Button></div></article>)}</div>
    </section>;
}
