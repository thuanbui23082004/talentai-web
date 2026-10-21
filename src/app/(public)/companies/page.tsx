import { Suspense } from "react";
import type { Metadata } from "next";
import { CompaniesExplorer } from "@/features/companies";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Danh sách công ty nổi bật | TalentAI", description: "Khám phá doanh nghiệp, tìm kiếm công ty theo địa điểm, ngành nghề và quy mô trên TalentAI." };
export default function CompaniesPage() {
    return <Suspense fallback={<div className="ui-container space-y-6 py-12" role="status" aria-label="Đang tải công ty"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-96" /></div>}><CompaniesExplorer /></Suspense>;
}
