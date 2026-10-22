"use client";

import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CalendarDays, CalendarPlus, CheckCheck, CircleCheck, Search, SlidersHorizontal } from "lucide-react";
import { Alert, Button, Input, Modal, ModalContent, Pagination, Select, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { FeedbackState } from "@/components/shared/feedback-state";
import { formatDate } from "@/lib/utils";
import { useApplications, useInterviews } from "../hooks/use-applications";
import { APPLICATION_LABELS } from "../labels";
import { downloadInterviewCalendar, scheduledInterview } from "../presentation";
import type { Application } from "../types";
import { ApplicationCard, InterviewActions, InterviewSchedule } from "./application-card";
import { NextInterviewCharacter } from "./next-interview-character";

const FILTERS = [
    { value: "all", label: "Tất cả", statuses: undefined },
    { value: "applied", label: "Đã ứng tuyển", statuses: ["submitted", "reviewing"] },
    { value: "interview", label: "Phỏng vấn", statuses: ["interview"] },
    { value: "hired", label: "Đã trúng tuyển", statuses: ["hired"] },
    { value: "closed", label: "Đã kết thúc", statuses: ["rejected", "withdrawn"] },
] satisfies { value: string; label: string; statuses: Application["status"][] | undefined }[];

export function ApplicationsPage() {
    const params = useSearchParams(); const router = useRouter(); const pathname = usePathname();
    const tab = FILTERS.find((filter) => filter.value === params.get("tab")) ?? FILTERS[0];
    const rawPage = Number(params.get("page"));
    const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const q = params.get("q") ?? "";
    const sort = params.get("sort") === "oldest" ? "oldest" : "newest";
    const [search, setSearch] = useState({ source: q, value: q });
    if (search.source !== q) setSearch({ source: q, value: q });
    const keyword = search.source === q ? search.value : q;
    const setKeyword = (value: string) => setSearch({ source: q, value });
    const [selected, setSelected] = useState<Application | null>(null);
    const update = (values: Record<string, string>) => {
        const next = new URLSearchParams(params.toString());
        Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
        router.replace(`${pathname}?${next}`, { scroll: false });
    };
    useEffect(() => {
        if (keyword === q) return;
        const timer = setTimeout(() => {
            const next = new URLSearchParams(params.toString());
            if (keyword.trim()) next.set("q", keyword.trim()); else next.delete("q");
            next.delete("page"); router.replace(`${pathname}?${next}`, { scroll: false });
        }, 300);
        return () => clearTimeout(timer);
    }, [keyword, q, params, pathname, router]);
    const query = useApplications({ page, pageSize: 6, q, sort, status: tab.statuses });
    const overview = useApplications({ page: 1, pageSize: 1 });
    const interviews = useInterviews();
    const [now] = useState(() => Date.now());
    const upcoming = interviews.data?.filter((item) => item.status === "scheduled" && ["accepted", "pending"].includes(item.invitationStatus) && Date.parse(item.endTime) > now).toSorted((a, b) => a.startTime.localeCompare(b.startTime)) ?? [];
    const nextInterview = upcoming[0];
    const selectedInterview = selected && scheduledInterview(interviews.data ?? [], selected.id);
    return <div className="candidate-page space-y-6">
        <section className="relative rounded-2xl border border-primary/10 bg-gradient-to-br from-secondary/80 via-card to-secondary/30" data-applications-hero>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"><div className="absolute -top-24 -right-16 size-64 rounded-full border-[32px] border-primary/5" /></div>
            <div className={`relative p-5 sm:p-7 ${nextInterview ? "xl:mr-[540px] 2xl:mr-[600px]" : ""}`} data-applications-hero-copy>
                <div><span className="text-xs font-semibold tracking-wider text-primary uppercase">Mỗi bước tiến, một cơ hội mới</span><CandidatePageTitle className="mt-2">Việc làm đã ứng tuyển</CandidatePageTitle><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Theo dõi hồ sơ, đón nhận phản hồi và sẵn sàng cho buổi phỏng vấn tiếp theo.</p><div className="mt-5 flex flex-wrap gap-3 text-xs"><span className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2"><BriefcaseBusiness className="size-4 text-primary" /><strong className="text-base leading-5 font-bold tabular-nums">{overview.data?.meta.totalItems ?? "—"}</strong> hồ sơ đã gửi</span><span className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2"><CalendarDays className="size-4 text-primary" /><strong className="text-base leading-5 font-bold tabular-nums">{interviews.isSuccess ? upcoming.length : "—"}</strong> lịch phỏng vấn sắp tới</span></div></div>
            </div>
            {nextInterview && <NextInterviewCharacter interview={nextInterview} onOpen={() => update({ tab: "interview", q: "", page: "" })} />}
        </section>
        <Tabs value={tab.value} onValueChange={(value) => { if (typeof value === "string") update({ tab: value, page: "" }); }}>
            <TabsList className="w-full justify-start gap-1 rounded-none border-0 border-b border-border bg-transparent p-0">{FILTERS.map((filter) => <TabsTrigger key={filter.value} value={filter.value} className="min-h-11 rounded-none border-b-2 border-transparent px-3 text-xs data-active:border-primary data-active:bg-transparent data-active:shadow-none sm:px-4 sm:text-sm">{filter.label}</TabsTrigger>)}</TabsList>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input aria-label="Tìm vị trí hoặc công ty" leadingIcon={<Search aria-hidden="true" />} placeholder="Tìm vị trí hoặc công ty…" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="w-full sm:max-w-sm" />
                <div className="flex items-center gap-2">
                    <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
                    <Select aria-label="Sắp xếp hồ sơ" value={sort} onValueChange={(value) => { if (value) update({ sort: value, page: "" }); }} options={[{ value: "newest", label: "Ứng tuyển mới nhất" }, { value: "oldest", label: "Ứng tuyển lâu nhất" }]} className="w-full sm:w-52" />
                </div>
            </div>
            {interviews.isError && <Alert className="mt-4" variant="warning" title="Chưa tải được lịch phỏng vấn"><div className="flex flex-wrap items-center gap-3">Thông tin hồ sơ vẫn được hiển thị.<Button variant="outline" onClick={() => interviews.refetch()}>Thử tải lại lịch</Button></div></Alert>}
            <TabsContent key={tab.value} value={tab.value}>
                {query.isPending ? <LoadingState title="Đang tải hồ sơ ứng tuyển" description="TalentAI đang lấy tiến trình hồ sơ và các cập nhật mới nhất của bạn." /> : query.isError ? <FeedbackState kind="error" title="Không thể tải hồ sơ ứng tuyển" description="Vui lòng thử lại để xem các cập nhật mới nhất." action={<Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button>} /> : query.data.items.length === 0 ? <EmptyState headingAs="h2" title={q ? "Không tìm thấy hồ sơ phù hợp" : page > 1 ? "Trang này chưa có hồ sơ" : "Chưa có hồ sơ trong mục này"} description={q ? "Thử một tên vị trí hoặc công ty khác, hoặc xóa từ khóa để xem lại danh sách." : "Mỗi cơ hội đều bắt đầu từ một bước nhỏ. Khám phá vị trí phù hợp và theo dõi hành trình tại đây."} action={<>{(q || page > 1) && <Button variant="outline" onClick={() => update({ q: "", page: "" })}>Xóa bộ lọc</Button>}<Button nativeButton={false} render={<Link href="/jobs" />}>Khám phá việc làm<ArrowRight /></Button></>} /> : <><div aria-busy={query.isFetching} className={`grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3 ${query.isPlaceholderData ? "opacity-60" : ""}`}>{query.data.items.map((application) => <ApplicationCard key={application.id} application={application} interview={scheduledInterview(interviews.data ?? [], application.id)} interviewState={interviews.isPending ? "loading" : interviews.isError ? "error" : "ready"} onDetails={() => setSelected(application)} />)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3"><p aria-live="polite" className="text-xs text-muted-foreground">Hiển thị <strong className="text-foreground">{(page - 1) * 6 + 1}–{Math.min(page * 6, query.data.meta.totalItems)}</strong> trong {query.data.meta.totalItems} hồ sơ</p><Pagination page={page} totalPages={query.data.meta.totalPages} disabled={query.isPlaceholderData} onPageChange={(value) => update({ page: String(value) })} /></div></>}
            </TabsContent>
        </Tabs>
        <p className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground"><CheckCheck className="mt-0.5 size-3.5 shrink-0" />Theo dõi thông báo để không bỏ lỡ phản hồi từ nhà tuyển dụng.</p>
        <Modal open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><ModalContent title="Chi tiết ứng tuyển" description={selected ? `${selected.job.title} · ${selected.job.company.name}` : undefined}>
            {selected && <div className="space-y-5">
                <div className="rounded-xl bg-muted/50 p-4 text-sm">
                    <p className="font-semibold">{APPLICATION_LABELS[selected.status]}</p>
                    <p className="mt-2 text-xs text-muted-foreground">CV đã gửi: {selected.cvTitle ?? "CV ứng tuyển"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Ngày ứng tuyển: {formatDate(selected.appliedAt)}</p>
                </div>
                {selectedInterview && <>
                    <InterviewSchedule interview={selectedInterview} />
                    {selectedInterview.message && <p className="text-sm leading-6 text-muted-foreground">{selectedInterview.message}</p>}
                    <InterviewActions key={selectedInterview.id} interview={selectedInterview} />
                    {selectedInterview.invitationStatus === "accepted" && <Button variant="secondary" onClick={() => downloadInterviewCalendar(selectedInterview)}><CalendarPlus />Thêm vào lịch cá nhân</Button>}
                    {selectedInterview.mode === "online" && !selectedInterview.meetingUrl && <p className="text-xs text-muted-foreground">Nhà tuyển dụng sẽ gửi đường dẫn tham gia sau.</p>}
                    {selectedInterview.invitationStatus === "accepted" && selectedInterview.meetingUrl && /^https?:\/\//i.test(selectedInterview.meetingUrl) && <a href={selectedInterview.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Mở phòng phỏng vấn<ArrowRight className="size-4" /></a>}
                </>}
                <div>
                    <h2 className="text-sm font-semibold">Hành trình hồ sơ</h2>
                    <ol className="mt-4 space-y-4">{(selected.statusHistory?.length ? selected.statusHistory : [{ status: selected.status, changedAt: selected.updatedAt, round: selected.currentRound }]).map((entry, index) => <li key={`${entry.status}-${index}`} className="flex gap-3"><CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">{APPLICATION_LABELS[entry.status]}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.changedAt)}{entry.round ? ` · ${entry.round}` : ""}</p></div></li>)}</ol>
                </div>
                <Link href={`/jobs/${selected.jobId}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Xem lại tin tuyển dụng<ArrowRight className="size-4" /></Link>
            </div>}
        </ModalContent></Modal>
    </div>;
}
