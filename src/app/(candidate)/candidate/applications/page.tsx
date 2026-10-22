import { Suspense } from "react";
import { ApplicationsPage } from "@/features/applications";

export default function CandidateApplicationsPage() {
  return <Suspense fallback={<p role="status">Đang tải hồ sơ ứng tuyển…</p>}><ApplicationsPage /></Suspense>;
}
