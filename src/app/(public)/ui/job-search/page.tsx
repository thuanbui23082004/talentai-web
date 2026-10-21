import { JobSearchDemo } from "@/components/shared/job-search-demo";

export default function JobSearchPreviewPage() {
    return (
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-8">
            <h1 className="text-2xl font-bold">Thanh tìm kiếm việc làm</h1>
            <p className="text-sm text-muted-foreground">Bản xem trước component: nhập từ khóa, chọn bộ lọc và thử xóa tiêu chí.</p>
            <JobSearchDemo />
        </main>
    );
}
