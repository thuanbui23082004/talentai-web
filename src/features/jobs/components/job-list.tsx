"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button, Alert, Select, Pagination } from "@/components/ui";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { FeedbackState } from "@/components/shared/feedback-state";
import { parseJobSearchParams } from "../schemas/search";
import { JobSearch } from "./job-search";
import { JobCard } from "./job-card";
import { useJobs } from "../hooks/use-jobs";
import type { JobFilters } from "../types";
import sidebarBanner from "../../../../public/images/banner/banner4.png";
import bottomBanner from "../../../../public/images/banner/banner3.png";

export function JobList() {
    const params = useSearchParams();
    const router = useRouter();
    const parsed = parseJobSearchParams(params);
    const filters: JobFilters = parsed.success ? { ...parsed.data, pageSize: params.has("pageSize") ? parsed.data.pageSize : 12 } : {};
    const { data, isPending, isError, error, refetch, isFetching } = useJobs(filters, undefined, parsed.success);
    const page = data?.meta.page ?? filters.page ?? 1;
    const totalPages = data ? Math.ceil(data.meta.totalItems / data.meta.pageSize) : 0;
    const updateQuery = (key: string, value: string) => {
        const next = new URLSearchParams(params.toString());
        next.set(key, value);
        if (key !== "page") next.delete("page");
        router.push(`/jobs?${next}`, { scroll: false });
    };
    const changePage = (value: number) => {
        updateQuery("page", String(value));
        document.getElementById("job-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return (
        <section aria-label="Tìm kiếm việc làm">
            <JobSearch initialFilters={filters} queryLabel="Từ khóa" stickyFilters heading={<>Tuyển dụng {data ? `${data.meta.totalItems} ` : ""}việc làm <span className="text-warning">{filters.q || "mới nhất"}</span>{filters.city ? ` tại ${filters.city}` : " trên TalentAI"}</>} />
            {!parsed.success && <Alert className="mt-6" variant="error" title="Bộ lọc không hợp lệ. Vui lòng xóa lọc và thử lại." />}
            <nav aria-label="Đường dẫn" className="mt-5 mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Link href="/" className="hover:text-primary">Trang chủ</Link><span>/</span><Link href="/jobs" className="hover:text-primary">Việc làm</Link>{filters.q && <><span>/</span><span className="font-medium text-foreground">{filters.q}</span></>}
            </nav>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div id="job-results" className="min-w-0 scroll-mt-48 space-y-5" aria-busy={isFetching}>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-card">
                        <div><h2 className="text-lg font-bold">Cơ hội dành cho bạn</h2><p role="status" className="mt-1 text-sm text-muted-foreground">{isFetching ? "Đang cập nhật…" : data ? `Tìm thấy ${data.meta.totalItems} việc làm` : ""}</p></div>
                        <Select aria-label="Sắp xếp việc làm" value={filters.sort ?? "relevance"} options={[{ value: "relevance", label: "Phù hợp nhất" }, { value: "newest", label: "Mới nhất" }, { value: "salary_desc", label: "Lương cao đến thấp" }, { value: "salary_asc", label: "Lương thấp đến cao" }, { value: "deadline", label: "Sắp hết hạn" }]} onValueChange={(value) => { if (value) updateQuery("sort", value); }} className="w-full text-xs sm:w-52" />
                    </div>
                    {parsed.success && isPending && <LoadingState title="Đang tải việc làm" description="Những cơ hội tiếp theo trên hành trình của bạn đang được chuẩn bị." />}
                    {isError && <FeedbackState kind="error" title={error instanceof ApiError ? error.message : "Không thể tải việc làm. Vui lòng thử lại."} description="Kết nối có thể đang bị gián đoạn. Hãy thử lại để tiếp tục tìm cơ hội phù hợp." action={<Button variant="outline" onClick={() => void refetch()}>Thử lại</Button>} />}
                    {!isError && data && <>
                        {data.items.length === 0 ? <EmptyState title="Không tìm thấy việc làm." description="Hãy thử từ khóa khác hoặc mở rộng địa điểm tìm kiếm." action={<Button variant="outline" onClick={() => router.push("/jobs")}>Xóa bộ lọc</Button>} /> : <ul className="grid gap-3 md:grid-cols-2">{data.items.map((job) => <li key={job.id} className="min-w-0"><JobCard job={job} /></li>)}</ul>}
                        {data.items.length > 0 && <div className="space-y-3 rounded-xl border border-border/60 bg-card px-4 py-4"><p className="text-center text-xs text-muted-foreground">Hiển thị {(page - 1) * data.meta.pageSize + 1}–{Math.min(page * data.meta.pageSize, data.meta.totalItems)} trong {data.meta.totalItems} việc làm</p><Pagination page={page} totalPages={totalPages} disabled={isFetching} onPageChange={changePage} /></div>}
                    </>}
                </div>
                <aside aria-label="Thông tin dành cho người tìm việc" className="space-y-5">
                    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                        <div className="mb-3 flex items-center gap-2 text-primary"><Sparkles className="size-4" /><h2 className="font-semibold text-foreground">Trạng thái tìm việc</h2></div>
                        <p className="text-xs leading-5 text-muted-foreground">Cập nhật trạng thái để nhận cơ hội việc làm phù hợp với bạn.</p>
                        <ul className="mt-4 space-y-3 text-sm">{["Sẵn sàng đi làm", "Đang xem xét cơ hội", "Chưa định chuyển việc"].map((label) => <li key={label} className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-full border border-border" />{label}</li>)}</ul>
                        <Link href="/login" className="mt-4 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">Đăng nhập để cập nhật trạng thái →</Link>
                    </div>
                    <Image src={sidebarBanner} alt="TalentAI — Ứng tuyển một chạm, mọi lúc mọi nơi" sizes="(min-width: 1024px) 280px, 100vw" className="hidden h-auto w-full rounded-xl lg:block" />
                </aside>
            </div>
            <div className="mt-10 overflow-hidden rounded-2xl border border-border/40 bg-secondary"><Image src={bottomBanner} alt="Khám phá cơ hội nghề nghiệp cùng TalentAI" sizes="(min-width: 1280px) 1216px, 100vw" className="h-auto w-full" /></div>
        </section>
    );
}
