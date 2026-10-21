import Link from "next/link";
import { NavigationDetails } from "@/components/shared/navigation-details";
import { BriefcaseBusiness, ChevronDown, Menu } from "lucide-react";
import { AccountLinks } from "@/features/auth";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AvailabilityButton } from "@/components/shared/availability-button";

const navigation = [
    { label: "Việc làm", links: [{ label: "Tìm việc làm", href: "/jobs" }, { label: "Việc làm nổi bật", href: "/#featured-jobs" }, { label: "Việc làm tuyển gấp", href: "/#urgent-jobs" }] },
    { label: "Công cụ", links: [{ label: "Tạo CV với TalentAI", href: "/#create-cv" }, { label: "Khám phá ngành nghề", href: "/#industries" }] },
];

export function SiteHeader() {
    return <header className="relative z-30">
        <div className="flex min-h-12 flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-card px-5 py-2 text-center text-xs sm:text-sm">
            <p>Ứng tuyển một chạm – Mọi lúc, mọi nơi cùng <strong className="text-primary">TalentAI</strong>
            </p>
            <AvailabilityButton title="TalentAI trên điện thoại" description="Ứng dụng TalentAI đang được hoàn thiện. Trong thời gian chờ, bạn có thể tìm việc và quản lý tài khoản ngay trên website bằng điện thoại." className="rounded-lg bg-brand-deep px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary">Tải app ngay</AvailabilityButton>
        </div>
        <div className="bg-brand-deep text-white">
            <div className="ui-container flex h-16 items-center gap-6 xl:gap-8">
                <Link href="/" aria-label="TalentAI — Trang chủ">
                    <BrandLogo light />
                </Link>
                <nav aria-label="Điều hướng chính" className="hidden items-center gap-5 text-xs font-semibold lg:flex xl:gap-7">
                    {navigation.map((item) => <NavigationDetails className="group relative" key={item.label}>
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-lg hover:text-white/80 [&::-webkit-details-marker]:hidden">{item.label}<ChevronDown className="size-3 group-open:rotate-180" />
                        </summary>
                        <div className="absolute top-full left-0 w-56 rounded-xl border border-border bg-card p-2 text-foreground shadow-float">{item.links.map((link) => <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-3 hover:bg-secondary hover:text-primary">{link.label}</Link>)}</div>
                    </NavigationDetails>)}
                    <Link href="/#news" className="py-3 hover:text-white/80">Cẩm nang nghề nghiệp</Link>
                    <Link href="/#companies" className="py-3 hover:text-white/80">HR Nexus</Link>
                </nav>
                <div className="ml-auto hidden items-center gap-4 lg:flex xl:gap-6">
                    <NavigationDetails className="group relative text-xs">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">Miền Nam<ChevronDown className="size-3" />
                        </summary>
                        <div className="absolute top-full right-0 w-48 rounded-xl border border-border bg-card p-2 text-foreground shadow-float">{[['TP.HCM', 'Miền Nam · TP.HCM'], ['Đà Nẵng', 'Miền Trung · Đà Nẵng'], ['Hà Nội', 'Miền Bắc · Hà Nội']].map(([city, label]) => <Link key={city} href={`/jobs?city=${encodeURIComponent(city)}`} className="block rounded-lg p-3 hover:bg-secondary">{label}</Link>)}</div>
                    </NavigationDetails>
                    <div className="border-x border-white/20 px-4 text-center">
                        <p className="text-[10px] text-white/70">Người tìm việc</p>
                        <AccountLinks />
                    </div>
                    <Link href="/login?role=recruiter" className="flex items-center gap-2 text-xs font-semibold">
                        <BriefcaseBusiness className="size-4" />
                        <span>
                            <span className="block text-[10px] font-normal">DÀNH CHO</span>Nhà tuyển dụng</span>
                    </Link>
                    <svg viewBox="0 0 30 20" role="img" aria-label="Tiếng Việt" className="hidden w-6 xl:block">
                        <path fill="#da251d" d="M0 0h30v20H0z" />
                        <path fill="#ff0" d="m15 4 1.4 4.1h4.3l-3.5 2.5 1.4 4.1-3.6-2.5-3.6 2.5 1.4-4.1-3.5-2.5h4.3Z" />
                    </svg>
                </div>
                <NavigationDetails className="group ml-auto lg:hidden">
                    <summary aria-label="Mở menu điều hướng" className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-white/25 [&::-webkit-details-marker]:hidden">
                        <Menu className="size-5" />
                    </summary>
                    <nav aria-label="Điều hướng di động" className="absolute top-full right-0 left-0 max-h-[75dvh] overflow-y-auto border-t border-white/15 bg-brand-deep p-5 shadow-float">
                        {navigation.flatMap((item) => item.links).map((link) => <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-3 hover:bg-white/10">{link.label}</Link>)}
                        <Link href="/#news" className="block px-3 py-3">Cẩm nang nghề nghiệp</Link>
                        <Link href="/login?role=recruiter" className="block px-3 py-3">Dành cho nhà tuyển dụng</Link>
                        <div className="border-t border-white/20 px-3 py-4">
                            <AccountLinks />
                        </div>
                    </nav>
                </NavigationDetails>
            </div>
        </div>
    </header>;
}
