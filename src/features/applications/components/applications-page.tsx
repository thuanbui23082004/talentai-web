"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRight,
    CheckCheck,
    FileText,
    RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FeedbackState } from "@/components/shared/feedback-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
    Button,
    Pagination,
    Tabs,
    TabsList,
    TabsTrigger,
    buttonVariants,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { trackingStatusLabels } from "../candidate-tracking-status";
import { useCandidateTracking } from "../hooks/use-candidate-tracking";
import type {
    CandidateTracking,
    CandidateTrackingStatus,
} from "../services/candidate-tracking";

const filters: {
    value: string;
    label: string;
    status?: CandidateTrackingStatus;
}[] = [
    { value: "all", label: "Tất cả" },
    { value: "submitted", label: "Đã nộp", status: "submitted" },
    { value: "reviewing", label: "Đang xem xét", status: "reviewing" },
    { value: "shortlisted", label: "Danh sách chọn", status: "shortlisted" },
    {
        value: "interview_scheduled",
        label: "Phỏng vấn",
        status: "interview_scheduled",
    },
    { value: "offered", label: "Đề nghị", status: "offered" },
    { value: "hired", label: "Đã tuyển dụng", status: "hired" },
    { value: "rejected", label: "Chưa phù hợp", status: "rejected" },
    { value: "withdrawn", label: "Đã rút", status: "withdrawn" },
];

function ApplicationCard({ application }: { application: CandidateTracking }) {
    const [logoFailed, setLogoFailed] = useState(false);
    return (
        <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start gap-3">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-secondary/15 px-1 text-primary sm:size-18">
                    {application.companyLogoUrl && !logoFailed ? (
                        <Image
                            src={application.companyLogoUrl}
                            alt={`Logo ${application.companyName ?? "công ty"}`}
                            width={72}
                            height={72}
                            unoptimized
                            className="max-h-full max-w-full object-contain"
                            onError={() => setLogoFailed(true)}
                        />
                    ) : (
                        <FileText className="size-5" />
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">
                        {application.jobTitle ?? "Tin tuyển dụng"}
                    </h2>
                    {application.companyName && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {application.companyName}
                        </p>
                    )}
                </div>
            </div>
            <section
                aria-label="Hồ sơ ứng tuyển"
                className="flex flex-1 flex-col gap-3 rounded-lg border border-l-4 border-primary/20 border-l-primary bg-secondary/40 p-3.5"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[13px] font-semibold">
                        <FileText className="size-4" />
                        Hồ sơ ứng tuyển
                    </p>
                    <span className="rounded-full border border-primary/20 bg-card px-2.5 py-1 text-xs font-semibold text-primary">
                        {trackingStatusLabels[application.status]}
                    </span>
                </div>
                <p className="text-[13px]">
                    Đã ứng tuyển {formatDate(application.appliedAt)}
                </p>
                <p className="mt-auto flex items-center gap-2 text-[13px]">
                    <FileText className="size-4 shrink-0" />
                    <span
                        className="truncate"
                        title={application.resumeFileName ?? undefined}
                    >
                        {application.resumeFileName ?? "CV đã ứng tuyển"}
                    </span>
                </p>
                <div className="border-t border-border pt-3">
                    <Link
                        href={`/candidate/applications/${application.id}`}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        Xem tiến trình <ArrowRight className="size-4" />
                    </Link>
                </div>
            </section>
        </article>
    );
}

export function ApplicationsPage() {
    const params = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const selectedFilter =
        filters.find((filter) => filter.value === params.get("tab")) ??
        filters[0];
    const rawPage = Number(params.get("page"));
    const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const query = useCandidateTracking(page, selectedFilter.status);

    function updateQuery(nextPage: number, filter = selectedFilter) {
        const next = new URLSearchParams();
        if (filter.value !== "all") next.set("tab", filter.value);
        if (nextPage > 1) next.set("page", String(nextPage));
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
            scroll: false,
        });
    }

    return (
        <div className="candidate-page space-y-6">
            <Tabs
                value={selectedFilter.value}
                onValueChange={(value) => {
                    const filter = filters.find((item) => item.value === value);
                    if (filter) updateQuery(1, filter);
                }}
            >
                <TabsList className="w-full justify-start gap-1 overflow-x-auto rounded-none border-0 border-b border-border bg-transparent p-0">
                    {filters.map((filter) => (
                        <TabsTrigger
                            key={filter.value}
                            value={filter.value}
                            className="min-h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs data-active:border-primary data-active:bg-transparent data-active:shadow-none sm:px-4 sm:text-sm"
                        >
                            {filter.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {query.data?.meta.totalItems ?? "—"} hồ sơ
                </p>
                <Button
                    variant="outline"
                    disabled={query.isFetching}
                    onClick={() => query.refetch()}
                >
                    <RefreshCw className="size-4" />
                    Làm mới
                </Button>
            </div>
            {query.isPending ? (
                <LoadingState title="Đang tải hồ sơ ứng tuyển" />
            ) : query.isError ? (
                <FeedbackState
                    kind="error"
                    title="Không thể tải hồ sơ ứng tuyển"
                    description="Vui lòng thử lại để xem các cập nhật mới nhất."
                    action={
                        <Button
                            variant="outline"
                            onClick={() => query.refetch()}
                        >
                            Thử lại
                        </Button>
                    }
                />
            ) : query.data.items.length === 0 ? (
                <EmptyState
                    title="Chưa có hồ sơ trong mục này"
                    description="Bạn có thể khám phá việc làm phù hợp và nộp hồ sơ ngay trên trang tin tuyển dụng."
                    action={
                        <Link href="/jobs" className={buttonVariants()}>
                            Khám phá việc làm
                        </Link>
                    }
                />
            ) : (
                <>
                    <div
                        aria-busy={query.isFetching}
                        className={`grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3 ${query.isPlaceholderData ? "opacity-60" : ""}`}
                    >
                        {query.data.items.map((item) => (
                            <ApplicationCard key={item.id} application={item} />
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Hiển thị{" "}
                            <strong className="text-foreground">
                                {(page - 1) * 6 + 1}–
                                {Math.min(page * 6, query.data.meta.totalItems)}
                            </strong>{" "}
                            trong {query.data.meta.totalItems} hồ sơ
                        </p>
                        <Pagination
                            page={page}
                            totalPages={query.data.meta.totalPages}
                            disabled={query.isPlaceholderData}
                            onPageChange={(nextPage) => updateQuery(nextPage)}
                        />
                    </div>
                </>
            )}
            <p className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground">
                <CheckCheck className="mt-0.5 size-3.5 shrink-0" />
                Theo dõi thông báo để không bỏ lỡ phản hồi từ nhà tuyển dụng.
            </p>
        </div>
    );
}
