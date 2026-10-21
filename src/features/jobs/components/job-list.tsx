"use client";

import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { parseJobSearchParams } from "../schemas/search";
import { JobSearch } from "./job-search";
import { useJobs } from "../hooks/use-jobs";
import {
    Button,
    Card,
    CardContent,
    Skeleton,
    Alert,
} from "@/components/ui";
import { EmptyState } from "@/components/shared/empty-state";

export function JobList() {
    const params = useSearchParams();
    const parsed = parseJobSearchParams(params);
    const filters = parsed.success ? parsed.data : {};
    const { data, isPending, isError, error, refetch, isFetching } =
        useJobs(filters, undefined, parsed.success);

    if (!parsed.success) return <section className="space-y-6" aria-label="Tìm kiếm việc làm"><JobSearch initialFilters={{}} queryLabel="Từ khóa" /><Alert variant="error" title="Bộ lọc không hợp lệ. Vui lòng xóa lọc và thử lại." /></section>;

    return (
        <section className="space-y-6" aria-label="Tìm kiếm việc làm">
            <JobSearch initialFilters={filters} queryLabel="Từ khóa" />
            {isPending && (
                <div
                    role="status"
                    aria-label="Đang tải việc làm"
                    className="space-y-3"
                >
                    <span className="sr-only">Đang tải việc làm…</span>
                    {[1, 2, 3].map((item) => (
                        <Skeleton key={item} className="h-28 w-full" />
                    ))}
                </div>
            )}
            {isError && (
                <Alert
                    variant="error"
                    title={
                        error instanceof ApiError
                            ? error.message
                            : "Không thể tải việc làm. Vui lòng thử lại."
                    }
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => void refetch()}
                    >
                        Thử lại
                    </Button>
                </Alert>
            )}
            {!isError && data && (
                <div aria-busy={isFetching} className="space-y-4">
                    <p role="status">
                        {isFetching
                            ? "Đang cập nhật…"
                            : `Tìm thấy ${data.meta.totalItems} việc làm`}
                    </p>
                    {data.items.length === 0 && (
                        <EmptyState
                            title="Không tìm thấy việc làm."
                            description="Hãy thử từ khóa khác hoặc mở rộng địa điểm tìm kiếm."
                        />
                    )}
                    <ul className="space-y-3">
                        {data.items.map((job) => (
                            <li key={job.id}>
                                <Card>
                                    <CardContent>
                                        <h2 className="text-lg font-bold">
                                            {job.title}
                                        </h2>
                                        <p>
                                            {job.company.name} ·{" "}
                                            {job.location.city}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {job.skills?.join(" · ")}
                                        </p>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
