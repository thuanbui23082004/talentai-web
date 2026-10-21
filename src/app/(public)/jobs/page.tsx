import { Suspense } from "react";
import type { Metadata } from "next";
import { JobList } from "@/features/jobs";

export const metadata: Metadata = { title: "Tìm việc làm | TalentAI", description: "Tìm kiếm việc làm theo vị trí, kỹ năng và địa điểm." };

export default function PublicJobsPage() {
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-sm">
    <h1 className="text-xl font-bold">Tìm việc làm</h1>
    <Suspense fallback={<p role="status">Đang tải tìm kiếm…</p>}><JobList /></Suspense>
  </main>;
}
