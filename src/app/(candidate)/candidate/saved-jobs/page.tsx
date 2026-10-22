import { Suspense } from "react";
import { SavedJobsPage } from "@/features/jobs";
import { LoadingState } from "@/components/shared/loading-state";

export default function CandidateSavedJobsPage() {
    return <Suspense fallback={<LoadingState title="Đang tải việc làm đã lưu" />}><SavedJobsPage /></Suspense>;
}
