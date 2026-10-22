import Link from "next/link";
import { ArrowRight, Bookmark, Building2, MapPin } from "lucide-react";
import type { FixedRecommendedJob } from "../types";

const FIXED_RECOMMENDED_JOBS: FixedRecommendedJob[] = [
    { id: "profile-job-1", title: "Web Developer (ReactJS)", company: "Công ty Cổ phần Điện tử Viễn thông Ánh Dương", location: "Quận 7, TP.HCM", salary: "Thương lượng", tags: ["ReactJS", "Hybrid"] },
    { id: "profile-job-2", title: "Frontend Developer", company: "Công ty Công nghệ Sao Việt", location: "Quận 1, TP.HCM", salary: "18 – 25 triệu", tags: ["TypeScript", "React"] },
    { id: "profile-job-3", title: "ReactJS Engineer", company: "Công ty Giải pháp Bình Minh", location: "Thủ Đức, TP.HCM", salary: "20 – 30 triệu", tags: ["ReactJS", "Full-time"] },
    { id: "profile-job-4", title: "UI Developer", company: "Công ty Phần mềm Đông Nam", location: "Hà Nội", salary: "15 – 22 triệu", tags: ["UI/UX", "Tailwind CSS"] },
    { id: "profile-job-5", title: "Junior Frontend Developer", company: "Công ty Công nghệ An Bình", location: "Đà Nẵng", salary: "12 – 18 triệu", tags: ["JavaScript", "Không yêu cầu KN"] },
    { id: "profile-job-6", title: "Web Application Developer", company: "Công ty Số Việt Nam", location: "Remote", salary: "Thương lượng", tags: ["Next.js", "Remote"] },
];

export function FixedRecommendedJobs() {
    return <aside aria-labelledby="fixed-recommended-jobs" className="space-y-3 xl:sticky xl:top-24 xl:self-start">
        <div className="flex items-center justify-between gap-3 px-1"><div><h2 id="fixed-recommended-jobs" className="font-semibold">Việc làm gợi ý cho bạn</h2><p className="mt-1 text-xs text-muted-foreground">Danh sách gợi ý cố định</p></div><Link href="/jobs" className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary hover:underline">Xem thêm<ArrowRight className="size-3.5" /></Link></div>
        <div className="space-y-3">{FIXED_RECOMMENDED_JOBS.map((job) => <article key={job.id} className="group rounded-xl border border-border/70 bg-card p-3.5 shadow-card transition hover:border-primary/30 hover:shadow-float">
            <div className="flex items-start gap-3"><span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/30 text-[11px] font-extrabold tracking-tight text-primary">BNS</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate text-[13px] font-semibold" title={job.title}>{job.title}</h3><button type="button" disabled title="Lưu việc: sắp ra mắt" aria-label={`Lưu ${job.title} (sắp ra mắt)`} className="shrink-0 text-muted-foreground/50"><Bookmark className="size-4" /></button></div><p className="mt-1 truncate text-[11px] text-muted-foreground" title={job.company}><Building2 className="mr-1 inline size-3" />{job.company}</p><p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground"><MapPin className="size-3 shrink-0" />{job.location}</p></div></div>
            <div className="mt-3 flex flex-wrap gap-1.5">{job.tags.map((tag) => <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-[10px] text-primary">{tag}</span>)}</div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3"><span className="text-[11px] font-medium text-primary">{job.salary}</span><Link href="/jobs" className="inline-flex min-h-9 items-center rounded-lg px-3 text-[11px] font-semibold text-primary hover:bg-secondary">Ứng tuyển</Link></div>
        </article>)}</div>
    </aside>;
}
