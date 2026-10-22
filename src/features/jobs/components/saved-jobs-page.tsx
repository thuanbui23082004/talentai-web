"use client";

import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRight,
    Bookmark,
    BriefcaseBusiness,
    CalendarClock,
    Heart,
    MapPin,
    Search,
    Undo2,
} from "lucide-react";
import {
    Alert,
    Button,
    Input,
    Pagination,
    Select,
    Skeleton,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    useToast,
} from "@/components/ui";
import { todayCalendarValue } from "@/lib/calendar";
import { useSavedJobActions, useSavedJobs } from "../hooks/use-saved-jobs";
import {
    filterSavedJobs,
    savedJobStatus,
    type SavedJobSort,
    type SavedJobTab,
} from "../saved-jobs-presentation";
import type { SavedJob } from "../types";
import { JobCard } from "./job-card";

const TABS: { value: SavedJobTab; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "open", label: "Còn tuyển" },
    { value: "expiring", label: "Sắp hết hạn" },
    { value: "closed", label: "Đã ngừng tuyển" },
];
const PAGE_SIZE = 6;

export function SavedJobsPage() {
    const params = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const query = useSavedJobs();
    const restore = useSavedJobActions();
    const { toast } = useToast();
    const [removed, setRemoved] = useState<SavedJob | null>(null);
    const [today] = useState(todayCalendarValue);
    const q = params.get("q") ?? "";
    const city = params.get("city") ?? "";
    const tab =
        TABS.find((item) => item.value === params.get("tab"))?.value ?? "all";
    const sort: SavedJobSort =
        params.get("sort") === "oldest"
            ? "oldest"
            : params.get("sort") === "deadline"
              ? "deadline"
              : "newest";
    const [search, setSearch] = useState({ source: q, value: q });
    if (search.source !== q) setSearch({ source: q, value: q });
    const keyword = search.source === q ? search.value : q;
    const update = (values: Record<string, string>) => {
        const next = new URLSearchParams(params.toString());
        Object.entries(values).forEach(([key, value]) =>
            value ? next.set(key, value) : next.delete(key),
        );
        router.replace(`${pathname}?${next}`, { scroll: false });
    };
    useEffect(() => {
        if (keyword === q) return;
        const timer = setTimeout(() => {
            const next = new URLSearchParams(params.toString());
            if (keyword.trim()) next.set("q", keyword.trim());
            else next.delete("q");
            next.delete("page");
            router.replace(`${pathname}?${next}`, { scroll: false });
        }, 300);
        return () => clearTimeout(timer);
    }, [keyword, q, params, pathname, router]);
    const items = query.data ?? [];
    const counts = {
        all: items.length,
        open: items.filter(
            (item) => savedJobStatus(item.job, today) !== "closed",
        ).length,
        expiring: items.filter(
            (item) => savedJobStatus(item.job, today) === "expiring",
        ).length,
        closed: items.filter(
            (item) => savedJobStatus(item.job, today) === "closed",
        ).length,
    };
    const filtered = filterSavedJobs(items, { q, city, tab, sort }, today);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const rawPage = Number(params.get("page"));
    const requestedPage =
        Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const page = Math.min(requestedPage, Math.max(1, totalPages));
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const cities = [
        ...new Set(items.map((item) => item.job.location.city)),
    ].sort((a, b) => a.localeCompare(b, "vi"));
    const stats = [
        {
            label: "Việc làm đã lưu",
            count: counts.all,
            Icon: Bookmark,
            tone: "bg-secondary text-primary",
        },
        {
            label: "Cơ hội còn tuyển",
            count: counts.open,
            Icon: BriefcaseBusiness,
            tone: "bg-success-soft text-success-foreground",
        },
        {
            label: "Hết hạn trong 7 ngày",
            count: counts.expiring,
            Icon: CalendarClock,
            tone: "bg-warning-soft text-warning-foreground",
        },
    ];

    return (
        <div className="candidate-page space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-xl">
                    <CandidatePageTitle className="mt-3">
                        Việc làm đã lưu
                    </CandidatePageTitle>
                </div>
                <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/jobs" />}
                >
                    Khám phá việc làm
                    <ArrowRight />
                </Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {stats.map(({ label, count, Icon, tone }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4"
                    >
                        <span
                            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}
                        >
                            <Icon aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <strong className="block text-2xl leading-7 font-bold tabular-nums">
                                {query.isSuccess ? count : "—"}
                            </strong>
                            <span className="text-[13px] text-foreground/80">
                                {label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {removed && (
                <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                    <p className="min-w-0 flex-1 text-sm">
                        Đã bỏ lưu <strong>{removed.job.title}</strong>.
                    </p>
                    <Button
                        variant="outline"
                        loading={restore.isPending}
                        onClick={() =>
                            restore.mutate(
                                { jobId: removed.job.id, saved: true },
                                {
                                    onSuccess: () => {
                                        setRemoved(null);
                                        toast({
                                            title: "Đã khôi phục việc làm đã lưu",
                                        });
                                    },
                                    onError: () =>
                                        toast({
                                            title: "Chưa thể khôi phục việc làm",
                                            description: "Vui lòng thử lại.",
                                            variant: "error",
                                        }),
                                },
                            )
                        }
                    >
                        <Undo2 />
                        Hoàn tác
                    </Button>
                    <Button variant="ghost" onClick={() => setRemoved(null)}>
                        Đóng
                    </Button>
                </div>
            )}

            <Tabs
                value={tab}
                onValueChange={(value) => {
                    if (typeof value === "string")
                        update({ tab: value, page: "" });
                }}
            >
                <TabsList className="w-full justify-start rounded-none border-0 border-b border-border bg-transparent p-0">
                    {TABS.map((item) => (
                        <TabsTrigger
                            key={item.value}
                            value={item.value}
                            className="flex min-h-11 items-center gap-2 rounded-none border-b-2 border-transparent px-3 text-xs data-active:border-primary data-active:bg-transparent data-active:shadow-none sm:px-4 sm:text-sm"
                        >
                            {item.label}
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                                {query.isSuccess ? counts[item.value] : "—"}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_210px]">
                    <Input
                        leadingIcon={<Search aria-hidden="true" />}
                        aria-label="Tìm việc làm đã lưu"
                        placeholder="Tìm vị trí hoặc công ty…"
                        value={keyword}
                        onChange={(event) =>
                            setSearch({ source: q, value: event.target.value })
                        }
                    />
                    <div className="flex items-center gap-2">
                        <MapPin
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                        />
                        <Select
                            aria-label="Lọc địa điểm"
                            value={city || "all"}
                            onValueChange={(value) =>
                                update({
                                    city: value === "all" ? "" : (value ?? ""),
                                    page: "",
                                })
                            }
                            options={[
                                { value: "all", label: "Tất cả địa điểm" },
                                ...cities.map((value) => ({
                                    value,
                                    label: value,
                                })),
                            ]}
                            className="w-full"
                        />
                    </div>
                    <Select
                        aria-label="Sắp xếp việc làm đã lưu"
                        value={sort}
                        onValueChange={(value) => {
                            if (value) update({ sort: value, page: "" });
                        }}
                        options={[
                            { value: "newest", label: "Lưu gần đây nhất" },
                            { value: "oldest", label: "Lưu lâu nhất" },
                            { value: "deadline", label: "Hạn nộp gần nhất" },
                        ]}
                    />
                </div>
                <TabsContent key={tab} value={tab}>
                    {query.isPending ? (
                        <div
                            role="status"
                            aria-label="Đang tải việc làm đã lưu"
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                        >
                            {Array.from({ length: 6 }, (_, index) => (
                                <Skeleton
                                    key={index}
                                    className="h-44 rounded-xl"
                                />
                            ))}
                        </div>
                    ) : query.isError ? (
                        <Alert
                            variant="error"
                            title="Không thể tải việc làm đã lưu"
                        >
                            <p>
                                Danh sách của bạn vẫn được giữ lại. Vui lòng thử
                                tải lại.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-3"
                                onClick={() => query.refetch()}
                            >
                                Thử lại
                            </Button>
                        </Alert>
                    ) : !visible.length ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center">
                            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                                <Heart aria-hidden="true" className="size-6" />
                            </span>
                            <h2 className="mt-4 text-lg font-semibold">
                                {!items.length
                                    ? "Chưa có việc làm đã lưu"
                                    : q || city
                                      ? "Không tìm thấy việc làm phù hợp"
                                      : tab === "expiring"
                                        ? "Chưa có việc làm sắp hết hạn"
                                        : "Chưa có việc làm trong mục này"}
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/80">
                                {!items.length
                                    ? "Nhấn trái tim trên thẻ việc làm để lưu những vị trí bạn yêu thích và xem lại tại đây."
                                    : q || city
                                      ? "Thử từ khóa khác hoặc xóa bộ lọc để xem lại các việc làm đã lưu."
                                      : "Bạn có thể xem tất cả việc đã lưu hoặc khám phá thêm các cơ hội mới."}
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-3">
                                {!!items.length && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            update({
                                                q: "",
                                                city: "",
                                                tab: "all",
                                                page: "",
                                            })
                                        }
                                    >
                                        Xem tất cả đã lưu
                                    </Button>
                                )}
                                <Button
                                    nativeButton={false}
                                    render={<Link href="/jobs" />}
                                >
                                    Khám phá việc làm
                                    <ArrowRight />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {visible.map((entry) => (
                                    <JobCard
                                        key={entry.job.id}
                                        job={entry.job}
                                        variant={entry.job.status === "open" ? "default" : "saved"}
                                        onUnsave={() => setRemoved(entry)}
                                    />
                                ))}
                            </div>
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-card px-4 py-3">
                                <p
                                    aria-live="polite"
                                    className="text-[13px] text-foreground/80"
                                >
                                    Hiển thị{" "}
                                    <strong>
                                        {(page - 1) * PAGE_SIZE + 1}–
                                        {Math.min(
                                            page * PAGE_SIZE,
                                            filtered.length,
                                        )}
                                    </strong>{" "}
                                    trong {filtered.length} việc làm đã lưu
                                </p>
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={(value) =>
                                        update({ page: String(value) })
                                    }
                                />
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
            <p className="text-center text-xs leading-5 text-muted-foreground">
                Nhấn trái tim đã tô màu để bỏ lưu. Bạn có thể hoàn tác ngay sau
                đó.
            </p>
        </div>
    );
}
