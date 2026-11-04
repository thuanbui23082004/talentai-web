import type { Metadata } from "next";
import { HomeHero } from "@/components/home/home-hero";
import { HomeCvBanner, HomeIndustries, HomeOpportunityBanner } from "@/components/home/home-discovery";
import { HomeCompanyList } from "@/features/companies";
import { HomeNews } from "@/components/home/home-news";
import { HomeJobCollections } from "@/features/jobs";
import { loadHomePage } from "@/server/bff/public/home";
import { RegistrationNotice } from "@/features/auth";

export const metadata: Metadata = { title: "TalentAI – Tìm đúng việc, chạm đến tương lai", description: "Khám phá việc làm, ngành nghề và doanh nghiệp cùng TalentAI. Kết nối nhân tài với cơ hội, mở lối cho hành trình sự nghiệp của bạn." };
export const dynamic = "force-dynamic";

export default async function PublicPage() {
    const { content, initialJobs, initialCompanies } = await loadHomePage();
    return <main>
        <RegistrationNotice />
        <HomeHero statistics={content.statistics} />
        <div className="ui-container space-y-12 py-10 sm:space-y-16 sm:py-14">
            <HomeJobCollections featuredIds={content.featuredIds} urgentIds={content.urgentIds} initialJobs={initialJobs} />
            <HomeOpportunityBanner />
            <HomeIndustries categories={content.categories} />
            <HomeCompanyList initialData={initialCompanies} />
            <HomeNews articles={content.articles} />
            <HomeCvBanner />
        </div>
    </main>;
}
