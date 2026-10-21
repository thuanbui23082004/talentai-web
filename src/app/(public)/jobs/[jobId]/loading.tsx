import { Skeleton } from "@/components/ui";

export default function LoadingJobDetail() {
    return (
        <main
            className="ui-container space-y-6 py-8"
            role="status"
            aria-label="Đang tải chi tiết việc làm"
        >
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Skeleton className="h-96 rounded-2xl" />
                <Skeleton className="h-80 rounded-2xl" />
            </div>
        </main>
    );
}
