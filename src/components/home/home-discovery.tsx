import Image from "next/image";
import { HomeBannerCarousel } from "./home-banner-carousel";
import Link from "next/link";
import { ArrowRight, Banknote, BriefcaseBusiness, ChartNoAxesCombined, Code2, Megaphone, Monitor, PencilRuler, ShieldCheck, Sparkles, Store, Tag, UsersRound } from "lucide-react";
import type { HomeContent } from "@/lib/home-content";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { CompanyCard } from "@/components/shared/company-card";

const categoryIcons = { design: PencilRuler, sales: ChartNoAxesCombined, marketing: Megaphone, finance: Banknote, technology: Monitor, engineering: Code2, business: BriefcaseBusiness, people: UsersRound };

export function HomeOpportunityBanner() {
    return <section aria-label="Khám phá cơ hội" className="grid gap-5 lg:grid-cols-[0.85fr_2fr]">
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-card">
            <ul className="space-y-1">{[{ label: "Bán sỉ - Bán lẻ - Quản lý cửa hàng", query: "Bán hàng", Icon: Store }, { label: "Bán hàng - Kinh doanh", query: "Kinh doanh", Icon: Tag }, { label: "Marketing", query: "Marketing", Icon: Megaphone }, { label: "Khoa học - Kỹ thuật", query: "Kỹ thuật", Icon: UsersRound }].map(({ label, query, Icon }) => <li key={label}>
                <Link href={`/jobs?q=${encodeURIComponent(query)}`} className="flex min-h-11 items-center gap-3 text-sm font-semibold hover:text-primary">
                    <Icon className="size-4 shrink-0 text-primary" />{label}</Link>
            </li>)}</ul>
            <Link href="#industries" className="mt-3 block border-t border-border pt-4 text-center text-base font-medium text-primary">Tất cả các ngành</Link>
        </div>
        <HomeBannerCarousel />
    </section>;
}

export function HomeIndustries({ categories }: { categories: HomeContent["categories"] }) {
    return <section id="industries" className="scroll-mt-8 rounded-2xl bg-secondary/30 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-5">
            <div>
                <h2 className="text-2xl font-bold text-brand-deep sm:text-3xl">Top ngành nghề nổi bật</h2>
                <p className="mt-2 text-sm text-muted-foreground">Bạn muốn tìm việc mới? Khám phá cơ hội dành cho bạn <Link href="/jobs" className="font-medium text-success hover:underline">tại đây</Link>.</p>
            </div>
            <Link href="/jobs" aria-label="Xem tất cả ngành nghề" className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
                <ArrowRight className="size-4" />
            </Link>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{categories.map((category) => {
            const Icon = categoryIcons[category.icon]; return <Link key={category.name} href={`/jobs?q=${encodeURIComponent(category.query)}`} className={`group border p-5 transition sm:p-6 ${category.icon === "marketing" ? "border-primary bg-primary text-white" : "border-border bg-card hover:border-primary hover:bg-primary hover:text-white"}`}>
                <Icon className={`size-8 ${category.icon === "marketing" ? "text-white" : "text-brand-bright group-hover:text-white"}`} strokeWidth={1.7} />
                <h3 className="mt-7 text-base font-semibold sm:text-lg">{category.name}</h3>
                <p className={`mt-2 flex flex-wrap items-center justify-between gap-1 text-xs sm:text-sm ${category.icon === "marketing" ? "text-white/85" : "text-muted-foreground group-hover:text-white/85"}`}>{category.count} cơ hội mẫu<ArrowRight className="size-4" />
                </p>
            </Link>;
        })}</div>
    </section>;
}

export function HomeCompanies({ companies }: { companies: HomeContent["companies"] }) {
    return <section id="companies" className="home-gradient scroll-mt-8 rounded-2xl p-5 shadow-float sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
            <div>
                <h2 className="text-2xl font-bold">Các Công Ty Hàng Đầu</h2>
                <p className="mt-2 text-xs text-white/75">Khám phá môi trường làm việc và cơ hội nghề nghiệp mới.</p>
            </div>
            <Link href="/companies" className="inline-flex min-h-11 items-center gap-2 text-xs font-medium">Xem tất cả công ty<ArrowRight className="size-3.5" />
            </Link>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{companies.map((company, index) => <CompanyCard key={company.id} name={company.name} wordmark={company.wordmark} logo={company.logo} count={company.count} href={`/companies/${company.id}`} tone={index} />)}</div>
    </section>;
}

export function HomeCvBanner() {
    return <section id="create-cv" className="home-cv-surface relative isolate overflow-hidden rounded-2xl px-6 py-10 text-white sm:px-12 sm:py-14 lg:px-20">
        <div className="relative z-10 max-w-lg">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-white/80">
                <Sparkles className="size-4" />TALENTAI WOWCV</div>
            <h2 className="text-2xl leading-tight font-bold sm:text-3xl">Tạo Ấn Tượng Với Nhà Tuyển Dụng Cùng <span className="text-white/80">TalentAI WowCV</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">Kể câu chuyện nghề nghiệp của bạn qua một bản CV rõ ràng, chuyên nghiệp và mang dấu ấn riêng.</p>
            <AvailabilityButton title="TalentAI WowCV" description="Công cụ tạo CV đang được hoàn thiện. Bạn có thể tạo tài khoản và khám phá việc làm trước khi tính năng được mở." className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-warning px-6 text-sm font-semibold text-foreground shadow-button hover:bg-warning-soft">Tạo CV ngay<ArrowRight className="size-4" />
            </AvailabilityButton>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
                <ShieldCheck className="size-3.5" />Chủ động lựa chọn cơ hội của bạn</p>
        </div>
        <Image src="/images/image 16.png" width={578} height={728} alt="" className="pointer-events-none absolute right-3 -bottom-12 hidden w-72 opacity-80 md:block lg:right-16 lg:w-80" />
    </section>;
}
