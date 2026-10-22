import { Suspense } from "react";
import type { Metadata } from "next";
import { CompaniesExplorer } from "@/features/companies";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = { title: "Danh sách công ty nổi bật | TalentAI", description: "Khám phá doanh nghiệp, tìm kiếm công ty theo địa điểm, ngành nghề và quy mô trên TalentAI." };
export default function CompaniesPage() {
    return <Suspense fallback={<LoadingState variant="page" title="Đang tải công ty" />}><CompaniesExplorer /></Suspense>;
}
