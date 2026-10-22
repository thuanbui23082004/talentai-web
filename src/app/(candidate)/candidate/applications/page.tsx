import { Suspense } from "react";
import { ApplicationsPage } from "@/features/applications";
import { LoadingState } from "@/components/shared/loading-state";

export default function CandidateApplicationsPage() {
  return <Suspense fallback={<LoadingState title="Đang tải hồ sơ ứng tuyển" />}><ApplicationsPage /></Suspense>;
}
