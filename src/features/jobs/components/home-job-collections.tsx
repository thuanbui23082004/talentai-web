"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, ListFilter } from "lucide-react";
import { Alert, Button, Select, Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useJobs } from "../hooks/use-jobs";
import { JOB_LOCATIONS } from "../search-options";
import type { Job, JobSearchResponse } from "../types";
import { JobCard } from "./job-card";

function Collection({ id, title, jobs }: { id: string; title: string; jobs: Job[] }) {
    const [city, setCity] = useState("");
    const tabsRef = useRef<HTMLDivElement>(null);
    const visible = city ? jobs.filter((job) => job.location.city === city) : jobs;
    return <section id={id} aria-label={title} className="scroll-mt-8">
        <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-warning sm:text-xl">
                <Flame className="size-5" />{title}</h2>
            <Link href={city ? `/jobs?city=${encodeURIComponent(city)}` : "/jobs"} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-medium text-primary">Xem thêm<ArrowRight className="size-3.5" />
            </Link>
        </div>
        <div className="mb-5 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 md:w-64 md:shrink-0">
                <ListFilter className="size-4 text-muted-foreground" />
                <span className="shrink-0 text-xs text-muted-foreground">Lọc theo:</span>
                <Select aria-label={`Địa điểm ${title}`} placeholder="Địa điểm" value={city} onValueChange={(value) => setCity(value ?? "")} options={JOB_LOCATIONS} className="h-10 border-0! px-1 text-xs shadow-none!" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <Button variant="ghost" size="icon" aria-label={`Địa điểm trước – ${title}`} className="shrink-0 rounded-full" onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}>
                    <ChevronLeft />
                </Button>
                <div ref={tabsRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 [scrollbar-width:none]" aria-label={`Lọc nhanh ${title}`}>
                    {["", "TP.HCM", "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bến Tre", "Hà Nội", "Đà Nẵng"].map((value) => <button key={value} type="button" aria-pressed={city === value} onClick={() => setCity(value)} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-medium transition ${city === value ? "border-brand-deep bg-brand-deep text-white" : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>{value || "Tất cả"}</button>)}
                </div>
                <Button variant="outline" size="icon" aria-label={`Địa điểm tiếp – ${title}`} className="shrink-0 rounded-full border-primary text-primary" onClick={() => tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" })}>
                    <ChevronRight />
                </Button>
            </div>
        </div>
        {visible.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{visible.map((job) => <JobCard key={job.id} job={job} />)}</div> : <EmptyState title="Chưa có việc làm tại địa điểm này" description="Chọn Tất cả hoặc thử một địa điểm khác." action={<Button variant="outline" onClick={() => setCity("")}>Xóa lọc địa điểm</Button>} />}
    </section>;
}

export function HomeJobCollections({ featuredIds, urgentIds, initialJobs }: { featuredIds: string[]; urgentIds: string[]; initialJobs?: JobSearchResponse }) {
    const { data, isPending, isError, refetch } = useJobs({ pageSize: 6 }, initialJobs);
    if(isPending) return <div role="status" aria-label="Đang tải việc làm" className="grid gap-3 md:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-40" />)}</div>;
    if(isError) return <Alert variant="error" title="Chưa thể tải việc làm">
        <Button className="mt-3" variant="outline" onClick={() => void refetch()}>Thử lại</Button>
    </Alert>;
    const select = (ids: string[]) => ids.map((id) => data?.items.find((job) => job.id === id)).filter((job): job is Job => !!job);
    // Unknown IDs from a real backend fall back to its current open jobs.
    const featured = select(featuredIds);
    const urgent = select(urgentIds);
    return <div className="space-y-12 sm:space-y-16">
        <Collection id="featured-jobs" title="Việc làm nổi bật" jobs={featured.length ? featured : data?.items ?? []} />
        <Collection id="urgent-jobs" title="Việc làm tuyển gấp" jobs={urgent} />
    </div>;
}
