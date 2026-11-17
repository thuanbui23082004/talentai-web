"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { FeedbackState } from "@/components/shared/feedback-state";
import { LoadingState } from "@/components/shared/loading-state";
import { formatDate, formatTime } from "@/lib/utils";
import { trackingStages, trackingStatusDescriptions, trackingStatusLabels } from "../candidate-tracking-status";
import { useCandidateTrackingDetail, useCandidateTrackingHistory } from "../hooks/use-candidate-tracking";

export function CandidateApplicationDetail({ id }: { id: string }) {
    const detail = useCandidateTrackingDetail(id);
    const history = useCandidateTrackingHistory(id);
    const application = detail.data;
    const isClosed = application?.status === "rejected" || application?.status === "withdrawn";
    const observedStatuses = new Set(history.data?.map(entry => entry.status) ?? []);
    observedStatuses.add("submitted");

    if (detail.isPending) return <div className="candidate-page"><LoadingState title="Đang tải chi tiết hồ sơ ứng tuyển" /></div>;
    if (detail.isError || !application) return <div className="candidate-page space-y-5">
        <Link href="/candidate/applications" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="size-4" />Quay lại danh sách</Link>
        <FeedbackState kind="error" title="Không thể tải chi tiết hồ sơ" description="Vui lòng thử lại để xem tiến trình ứng tuyển." action={<Button variant="outline" onClick={() => detail.refetch()}>Thử lại</Button>} />
    </div>;

    return <div className="candidate-page space-y-6 pb-10">
        <nav aria-label="Điều hướng hồ sơ ứng tuyển" className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/candidate/applications" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" />Danh sách ứng tuyển</Link>
            <Button variant="outline" disabled={detail.isFetching || history.isFetching} onClick={() => { void detail.refetch(); void history.refetch(); }}><RefreshCw className="size-4" />Làm mới</Button>
        </nav>

        <header className="relative overflow-hidden rounded-2xl bg-[linear-gradient(110deg,var(--brand-deep),var(--primary)_65%,var(--brand-bright))] px-5 py-6 text-white shadow-card sm:px-8">
            <div className="pointer-events-none absolute -top-28 right-16 size-64 rounded-full border-[36px] border-white/5" aria-hidden="true" />
            <div className="relative flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-emerald-400/20 px-2.5 py-1 font-medium text-emerald-100">Hồ sơ đang theo dõi</span><span className="text-white/65">Mã hồ sơ: {application.id}</span></div>
                    <div className="mt-4 flex items-center gap-4"><span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"><FileText className="size-7" /></span><div className="min-w-0"><h1 className="text-xl font-bold leading-tight sm:text-2xl">{application.jobTitle ?? "Chi tiết hồ sơ ứng tuyển"}</h1>{application.companyName && <p className="mt-1 text-sm text-white/80">{application.companyName}</p>}</div></div>
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/80"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />Nộp ngày {formatDate(application.appliedAt)}</span><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />Trạng thái: {trackingStatusLabels[application.status]}</span></div>
                </div>
                <Link href={`/jobs/${application.jobId}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary hover:bg-white/90">Xem lại tin tuyển dụng <ArrowUpRight className="size-4" /></Link>
            </div>
        </header>

        <section aria-labelledby="progress-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="progress-heading" className="flex items-center gap-2 text-lg font-semibold"><span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary"><Clock3 className="size-5" /></span>Tiến trình các bước tuyển dụng</h2><p className="mt-2 text-sm text-muted-foreground">Các mốc được cập nhật theo lịch sử xử lý hồ sơ của bạn.</p></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">{isClosed ? "Hồ sơ đã kết thúc" : application.status === "hired" ? "Đã hoàn tất" : "Đang theo dõi"}</span>
            </div>
            <ol className="relative mt-7 grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6" aria-label="Tiến trình ứng tuyển">
                {trackingStages.map((stage, index) => {
                    const active = application.status === stage;
                    const recorded = observedStatuses.has(stage) && !active;
                    return <li key={stage} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center text-center">
                        <span className={`relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold ${active ? "border-emerald-600 bg-emerald-600 text-white" : recorded ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`} aria-hidden="true">{active || recorded ? <Check className="size-4" /> : String(index + 1).padStart(2, "0")}</span>
                        {index < trackingStages.length - 1 && <span className={`absolute left-[calc(50%+18px)] top-[17px] hidden h-0.5 w-[calc(100%-36px)] lg:block ${recorded ? "bg-primary" : "bg-border"}`} aria-hidden="true" />}
                        <p className={`mt-3 max-w-28 text-xs font-semibold leading-5 ${active ? "text-emerald-700" : recorded ? "text-primary" : "text-muted-foreground"}`}>{trackingStatusLabels[stage]}</p>
                        <p className="text-[11px] text-muted-foreground">{active ? "Hiện tại" : recorded ? "Đã ghi nhận" : "Chưa cập nhật"}</p>
                    </li>;
                })}
            </ol>
            {isClosed && <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4"><Clock3 className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{trackingStatusLabels[application.status]}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Trạng thái kết thúc được hiển thị riêng; các bước chưa ghi nhận không được đánh dấu hoàn thành.</p></div></div>}
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <section aria-labelledby="history-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
                <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Clock3 className="size-5" /></span><div><h2 id="history-heading" className="text-lg font-semibold">Nhật ký tiến trình chi tiết</h2><p className="text-xs text-muted-foreground">Các cập nhật được ghi nhận theo thời gian</p></div></div>
                {history.isPending ? <p className="mt-6 text-sm text-muted-foreground" role="status">Đang tải lịch sử trạng thái…</p> : history.isError ? <div className="mt-6"><p className="text-sm text-muted-foreground">Chưa tải được lịch sử trạng thái.</p><Button variant="outline" className="mt-3" onClick={() => history.refetch()}>Thử lại lịch sử</Button></div> : history.data?.length ?
                    <ol className="relative mt-7 space-y-4 border-l-2 border-secondary pl-6">
                        {history.data.toReversed().map((entry, index, entries) => <li key={`${entry.version}-${entry.changedAt}`} className="relative rounded-xl border border-border bg-muted/20 p-4">
                            <span className="absolute -left-[33px] top-4 flex size-4 items-center justify-center rounded-full border-[3px] border-card bg-primary ring-2 ring-secondary" aria-hidden="true" />
                            <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-semibold text-foreground">{trackingStatusLabels[entry.status]}</p><time dateTime={entry.changedAt} className="text-xs text-muted-foreground">{formatTime(entry.changedAt)} · {formatDate(entry.changedAt)}</time></div>
                            <p className="mt-2 text-xs font-medium text-primary">{entry.note ? "Ghi chú cập nhật" : "Ý nghĩa trạng thái"}</p>
                            <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">{entry.note || trackingStatusDescriptions[entry.status]}</p>
                            {(entry.previousStatus || entries[index + 1]?.status) && <p className="mt-2 text-xs text-primary">Từ {trackingStatusLabels[entry.previousStatus ?? entries[index + 1].status]} chuyển sang {trackingStatusLabels[entry.status]}</p>}
                        </li>)}
                    </ol> : <p className="mt-6 text-sm text-muted-foreground">Chưa có lịch sử trạng thái từ hệ thống.</p>}
            </section>

            <aside className="space-y-5">
                <section aria-labelledby="file-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                    <h2 id="file-heading" className="text-base font-semibold">Hồ sơ đã gửi</h2>
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><FileText className="size-5" /></span><div className="min-w-0"><p className="break-all text-sm font-medium">{application.resumeFileName ?? "CV đã nộp"}</p><p className="mt-1 text-xs text-muted-foreground">Nộp ngày {formatDate(application.appliedAt)}</p></div></div>
                    <p className="mt-4 text-xs text-muted-foreground">Mã hồ sơ: <span className="break-all font-mono">{application.id}</span></p>
                </section>
                {application.coverLetter && <section aria-labelledby="letter-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"><h2 id="letter-heading" className="flex items-center gap-2 text-base font-semibold"><FileText className="size-4 text-primary" />Thư giới thiệu đã gửi</h2><p className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm leading-6 whitespace-pre-wrap">{application.coverLetter}</p></section>}
            </aside>
        </div>
    </div>;
}
