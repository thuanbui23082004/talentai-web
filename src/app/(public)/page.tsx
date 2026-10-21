import type { Metadata } from "next";
import { HomeHero } from "@/components/home/home-hero";
import { HomeCompanies, HomeCvBanner, HomeIndustries, HomeOpportunityBanner } from "@/components/home/home-discovery";
import { HomeNews } from "@/components/home/home-news";
import { HomeJobCollections } from "@/features/jobs";
import { loadHomePage } from "@/server/bff/home";

export const metadata: Metadata = { title: "TalentAI – Tìm đúng việc, chạm đến tương lai", description: "Khám phá việc làm, ngành nghề và doanh nghiệp cùng TalentAI. Kết nối nhân tài với cơ hội, mở lối cho hành trình sự nghiệp của bạn." };
export const dynamic = "force-dynamic";

export default async function PublicPage() {
    const { content, initialJobs } = await loadHomePage();
    return <main>
        <HomeHero statistics={content.statistics} />
        <div className="ui-container space-y-12 py-10 sm:space-y-16 sm:py-14">
            <HomeJobCollections featuredIds={content.featuredIds} urgentIds={content.urgentIds} initialJobs={initialJobs} />
            <HomeOpportunityBanner />
            <HomeIndustries categories={content.categories} />
            <HomeCompanies companies={content.companies} />
            <HomeNews articles={content.articles} />
            <HomeCvBanner />
        </div>
    </main>;
}
