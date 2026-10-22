import { Suspense } from "react";
import type { Metadata } from "next";
import { JobList } from "@/features/jobs";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = {
    title: "Tìm việc làm | TalentAI",
    description: "Tìm kiếm việc làm theo vị trí, kỹ năng và địa điểm.",
};

export default function PublicJobsPage() {
    return (
        <main className="ui-container py-6 text-sm sm:py-8">
            <Suspense fallback={<LoadingState title="Đang tải tìm kiếm" />}>
                <JobList />
            </Suspense>
        </main>
    );
}
