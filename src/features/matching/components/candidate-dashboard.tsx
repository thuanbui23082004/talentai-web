import Image from "next/image";
import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";
import Link from "next/link";
import { ArrowRight, AudioLines, Bookmark, Send, Sparkles, Users, Zap } from "lucide-react";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { Button, Card } from "@/components/ui";
import type { AuthUser } from "@/features/auth";
import { formatSalaryRange } from "@/lib/utils";

// Presentation data from the requested design; no dashboard/matching API exists yet.
const PREVIEW_JOBS = [
    {
        title: "Senior Performance Marketing Specialist",
        company: "VNG Corporation",
        monogram: "VNG",
        location: "Quận 7, TP.HCM (Hybrid)",
        score: 96,
        salary: { min: 25_000_000, max: 35_000_000 },
        skills: ["Facebook Ads", "Google Ads", "GA4", "ROAS Optimization"],
        reason: "Phù hợp với kinh nghiệm Digital Marketing và các kỹ năng quảng cáo, phân tích hiệu quả chiến dịch trong CV minh họa.",
    },
    {
        title: "Growth Marketing Lead",
        company: "MoMo (M_Service)",
        monogram: "MoMo",
        location: "Quận 1, TP.HCM",
        score: 93,
        salary: { min: 30_000_000, max: 45_000_000 },
        skills: ["Growth Hacking", "SQL", "User Retention", "Fintech"],
        reason: "Phù hợp với định hướng tăng trưởng và kinh nghiệm giữ chân người dùng trong CV minh họa; cần bổ sung kinh nghiệm chuyên sâu về Fintech.",
    },
];

function MiniChart({ line = false }: { line?: boolean }) {
    if (line) return <svg viewBox="0 0 80 52" className="h-12 w-20 text-brand-bright" fill="none" aria-hidden="true">
        <path d="M5 45C13 13 17 31 25 27S37 4 45 9s11 6 15-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 9s11 6 15-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".15" />
    </svg>;
    return <div className="flex h-12 items-end gap-2" aria-hidden="true">
        {[82, 52, 70, 90, 26].map((height, index) => <span key={index} className="flex h-full w-1.5 items-end overflow-hidden rounded-full bg-secondary">
            <span className="w-full rounded-full bg-primary" style={{ height: `${height}%` }} />
        </span>)}
    </div>;
}

export function CandidateDashboard({ user }: { user: AuthUser }) {
    return <div className="candidate-page candidate-dashboard space-y-5">
        <CandidatePageTitle>Tổng quan</CandidatePageTitle>
        <section aria-labelledby="dashboard-greeting" className="relative isolate overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#853de0,#6250ef_55%,#8278fa)] px-6 py-7 text-primary-foreground shadow-button sm:px-10 sm:py-8">
            <div className="relative z-10 max-w-xl sm:pr-32 lg:pr-16 xl:pr-0">
                <h2 id="dashboard-greeting" className="text-2xl font-semibold tracking-tight sm:text-3xl">Chào buổi sáng, {user.fullName}!</h2>
                <p className="mt-3 max-w-lg text-xs leading-6 text-white/90 sm:text-sm">Hôm nay đã tìm thấy <span className="font-semibold text-white">18 cơ hội việc làm mới</span> phù hợp 90%+ với hồ sơ Digital Marketing của bạn.</p>
                <Button nativeButton={false} render={<Link href="/jobs" />} variant="secondary" className="mt-5 border-0 bg-card px-6 font-medium hover:bg-secondary">Khám phá việc làm ngay</Button>
            </div>
            <Image src="/images/image 16.png" alt="" width={599} height={695} priority className="pointer-events-none absolute -right-3 -bottom-12 hidden h-64 w-56 object-contain sm:block lg:right-4 xl:right-10 xl:-bottom-16 xl:h-80 xl:w-64" />
        </section>

        <div className="grid gap-4 sm:grid-cols-3" aria-label="Thống kê hoạt động minh họa">
            <Card className="flex min-h-25 items-center justify-between gap-4 border-0 px-6 py-5 shadow-none">
                <div><p className="text-xs text-muted-foreground">Đã ứng tuyển</p><p className="mt-1 text-3xl font-semibold tracking-tight text-brand-deep">12</p></div>
                <MiniChart />
            </Card>
            <Card className="flex min-h-25 items-center gap-4 border-0 px-5 py-5 shadow-none">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/60 text-primary"><AudioLines className="size-5" aria-hidden="true" /></span>
                <div><p className="text-xs text-muted-foreground">Lượt xem hồ sơ</p><p className="mt-1 text-3xl font-semibold tracking-tight text-brand-deep">148</p></div>
            </Card>
            <Card className="flex min-h-25 items-center gap-4 border-0 px-5 py-5 shadow-none">
                <span className="candidate-dashboard-icon flex size-11 shrink-0 items-center justify-center rounded-full text-white"><Users className="size-5" aria-hidden="true" /></span>
                <div className="flex-1"><p className="text-xs text-muted-foreground">Lời mời phỏng vấn</p><p className="mt-1 text-3xl font-semibold tracking-tight text-brand-deep">3</p></div>
                <span className="hidden xl:block"><MiniChart line /></span>
            </Card>
        </div>

        <section aria-labelledby="recommended-jobs" className="rounded-2xl border border-border/60 bg-card px-4 pt-5 pb-7 sm:px-6 sm:pb-12">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 id="recommended-jobs" className="flex items-center gap-2 text-base font-semibold"><Sparkles className="size-5 text-primary" aria-hidden="true" />Việc làm phù hợp với bạn</h2>
                <Link href="/candidate/matching" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">Xem thêm <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
            <div className="space-y-4">
                {PREVIEW_JOBS.map((job, index) => <article key={job.title} className="rounded-xl bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${index === 0 ? "bg-brand-deep text-white" : "bg-secondary-hover text-primary"}`} aria-hidden="true">{job.monogram}</span>
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold leading-6 sm:text-base">{job.title}</h3>
                                {index === 0 && <span className="mt-1 inline-block rounded-md bg-secondary-hover px-2 py-0.5 text-xs font-medium text-brand-deep">Match lý tưởng</span>}
                                <p className="mt-1 text-xs leading-5 sm:text-sm">{job.company}<span className="mx-2 text-muted-foreground" aria-hidden="true">•</span><span className="text-muted-foreground">{job.location}</span></p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 pl-15 sm:block sm:pl-0 sm:text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-base font-semibold text-primary"><Zap className="size-3.5" aria-hidden="true" />{new Intl.NumberFormat("vi-VN", { style: "percent" }).format(job.score / 100)}</span>
                            <p className="mt-1 text-sm font-semibold text-primary">{formatSalaryRange(job.salary, true)}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <ul className="flex flex-wrap gap-1.5" aria-label="Kỹ năng phù hợp">{job.skills.map((skill) => <li key={skill} className="rounded-md bg-secondary px-2.5 py-1 text-xs">{skill}</li>)}</ul>
                        <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-end">
                            <AvailabilityButton title="Lưu việc làm" description="Việc làm này là dữ liệu minh họa. Chức năng lưu việc sẽ được kết nối khi có API hỗ trợ." className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary"><Bookmark className="size-4" /><span className="sr-only">Lưu {job.title}</span></AvailabilityButton>
                            <AvailabilityButton title={`Ứng tuyển ${job.title}`} description="Đây là việc làm minh họa cho giao diện. Bạn có thể khám phá các tin tuyển dụng hiện có; chức năng nộp hồ sơ đang được phát triển." className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover sm:min-h-9"><Send className="size-3.5" aria-hidden="true" />Ứng tuyển nhanh</AvailabilityButton>
                        </div>
                    </div>
                    <details className="mt-2 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer py-2 text-primary">Gợi ý từ AI · Vì sao phù hợp?</summary><p className="max-w-2xl pb-2 leading-5">{job.reason} Điểm số chỉ mang tính minh họa, hỗ trợ bạn tham khảo.</p></details>
                </article>)}
            </div>
            <Link href="/candidate/matching" className="mt-4 flex min-h-11 items-center justify-center gap-1 rounded-xl bg-secondary px-4 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-secondary-hover">Xem tất cả 18 việc làm được AI đề xuất <ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link>
            <p className="mt-4 text-xs text-muted-foreground">Dữ liệu minh họa theo thiết kế. Thống kê và gợi ý việc làm chưa kết nối API.</p>
        </section>
    </div>;
}
