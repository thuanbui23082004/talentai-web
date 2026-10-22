import { Suspense } from "react";
import { SavedJobsPage } from "@/features/jobs";

export default function CandidateSavedJobsPage() {
    return <Suspense fallback={<p role="status">Đang tải việc làm đã lưu…</p>}><SavedJobsPage /></Suspense>;
}
