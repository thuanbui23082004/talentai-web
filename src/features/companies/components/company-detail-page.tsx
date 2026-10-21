import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, Building2, Globe2, LayoutGrid, MapPin, Plus, Star, UsersRound } from "lucide-react";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { CompanyCard } from "@/components/shared/company-card";
import { LocationMap } from "@/components/shared/location-map";
import { AppDownloadBanner } from "@/components/shared/app-download-banner";
import { CompanyIntroduction } from "./company-introduction";
import { CompanyJobs } from "./company-jobs";
import { CompanyShare } from "./company-share";
import type { Company } from "../types";
import cover from "../../../../public/images/banner/banner_company.png";

function publicWebsite(value?: string) {
    if (!value) return null;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url : null; } catch { return null; }
}

export function CompanyDetailPage({ company, related }: { company: Company; related: Company[] | null }) {
    const address = company.address || company.city || "";
    const industry = company.industries?.map((item) => item.name).join(", ");
    const website = publicWebsite(company.website);
    const surface = "rounded-2xl border border-border/50 bg-card p-5 shadow-card sm:p-6";
    return <main className="mx-auto w-full max-w-[1180px] space-y-6 px-5 pt-5 pb-12 text-sm sm:px-8 sm:pt-6 sm:pb-16">
        <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Link href="/" className="hover:text-primary">Trang chủ</Link><span>›</span><Link href="/companies" className="hover:text-primary">Công ty</Link><span>›</span><span aria-current="page" className="text-foreground">{company.name}</span></nav>
        <section aria-labelledby="company-title" className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="relative h-44 bg-secondary sm:h-60"><Image src={cover} alt="" fill priority sizes="(min-width: 1180px) 1116px, 100vw" className="object-cover" /></div>
            <div className="relative flex flex-col gap-4 px-5 pt-4 pb-5 sm:flex-row sm:items-start sm:gap-6 sm:px-6 sm:pb-6">
                <div className="relative -mt-14 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card p-3 text-center text-base font-extrabold text-primary shadow-card sm:-mt-16 sm:size-32 sm:text-xl">{company.logoUrl ? <Image src={company.logoUrl} alt={company.name} fill unoptimized className="object-contain p-3" /> : company.name}</div>
                <div className="min-w-0 flex-1"><div className="flex items-start gap-2"><h1 id="company-title" className="text-xl leading-snug font-bold sm:text-2xl">{company.name}</h1>{company.isVerified && <BadgeCheck aria-label="Công ty đã xác minh" className="mt-1 size-5 shrink-0 text-primary" />}</div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{company.city && <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-primary" />Địa điểm: {company.city}</span>}{industry && <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="size-4 text-primary" />Lĩnh vực: {industry}</span>}</div></div>
                <div className="grid grid-cols-2 gap-2 sm:self-end"><AvailabilityButton title="Theo dõi công ty" description="Tính năng theo dõi công ty đang được hoàn thiện. Bạn có thể xem các vị trí đang tuyển ngay trên trang này." className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-deep"><Plus className="size-4" />Theo dõi</AvailabilityButton><CompanyShare name={company.name} compact /></div>
            </div>
        </section>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)]">
            <div className="min-w-0 space-y-7">
                <CompanyIntroduction name={company.name} description={company.description} />
                <CompanyJobs companyId={company.id} />
                <section aria-labelledby="similar-companies-title"><h2 id="similar-companies-title" className="mb-4 text-lg font-bold">Công ty tiêu biểu cùng lĩnh vực</h2>{related === null ? <p className="rounded-xl border border-border bg-card p-5 text-muted-foreground">Chưa thể tải các công ty cùng lĩnh vực. <Link href="/companies" className="text-primary hover:underline">Xem danh sách công ty</Link></p> : related.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{related.map((item, index) => <CompanyCard key={item.id} name={item.name} logo={item.logoUrl} count={item.openJobsCount} href={`/companies/${item.id}`} tone={index} />)}</div> : <p className="rounded-xl border border-border bg-card p-5 text-muted-foreground">Chưa có công ty khác cùng lĩnh vực.</p>}</section>
            </div>
            <aside aria-label="Thông tin và liên hệ công ty" className="min-w-0 space-y-4">
                <section className={surface}><h2 className="text-base font-bold">Thông tin chung</h2><dl className="mt-5 space-y-4">{[{ Icon: UsersRound, label: "Quy mô", value: company.size ? `${company.size} nhân viên` : "Chưa cập nhật" }, { Icon: LayoutGrid, label: "Lĩnh vực hoạt động", value: industry || "Chưa cập nhật" }].map(({ Icon, label, value }) => <div key={label} className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/50 text-primary"><Icon className="size-4" /></span><div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm leading-5 font-medium">{value}</dd></div></div>)}</dl><div className="mt-4 flex items-start gap-2 border-t border-border/60 pt-4 text-xs"><Globe2 className="size-4 shrink-0 text-primary" />{website ? <a href={website.href} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{website.hostname}</a> : <span className="text-muted-foreground">Website chưa cập nhật</span>}</div></section>
                <section className={surface}><h2 className="text-base font-bold">Liên hệ</h2><p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><Building2 className="mt-1 size-4 shrink-0" />{address || "Công ty chưa cập nhật địa chỉ."}</p><LocationMap address={address} /></section>
                <CompanyShare name={company.name} />
                <section className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card"><div className="relative bg-warning-soft p-5"><h2 className="text-sm font-bold">Đánh giá công ty</h2><p className="mt-3 text-3xl font-bold">—</p><div className="mt-2 flex gap-1 text-warning">{[0, 1, 2, 3, 4].map((star) => <Star key={star} className="size-3.5" />)}</div><p className="mt-2 text-xs text-muted-foreground">Chưa có đánh giá</p><Star aria-hidden="true" className="absolute top-12 right-5 size-14 fill-warning/20 text-warning/40" /></div><div className="space-y-4 p-5">{["Lương thưởng & phúc lợi", "Đào tạo & cơ hội", "Sự quan tâm đến nhân viên", "Văn hóa công ty", "Văn phòng làm việc"].map((label) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><div className="mt-2 h-1.5 rounded-full bg-muted" /></div>)}<p className="text-xs leading-5 text-muted-foreground">Thông tin đánh giá sẽ được cập nhật khi tính năng ra mắt.</p></div></section>
            </aside>
        </div>
        <div className="pt-3 sm:pt-5"><AppDownloadBanner /></div>
    </main>;
}
