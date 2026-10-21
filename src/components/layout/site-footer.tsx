import Link from "next/link";
import { Smartphone } from "lucide-react";
import { SocialIcon } from "@/components/shared/social-icon";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AvailabilityButton } from "@/components/shared/availability-button";

const appDescription = "Ứng dụng đang được hoàn thiện. Bạn có thể sử dụng giao diện tìm việc của TalentAI trên trình duyệt điện thoại.";

export function SiteFooter() {
    return <footer className="bg-footer text-white">
        <div className="ui-container pt-12 pb-5">
            <div className="grid gap-9 text-xs leading-7 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.15fr] lg:gap-8">
                <div>
                    <h2 className="mb-4 text-sm font-bold">Về chúng tôi</h2>
                    <p className="font-semibold">TalentAI – Kết nối nhân tài với cơ hội</p>
                    <p className="mt-2 max-w-xs text-white/75">Nền tảng tuyển dụng thông minh, đồng hành cùng ứng viên và doanh nghiệp trên hành trình phát triển sự nghiệp.</p>
                    <p className="mt-3 text-white/75">Tìm đúng việc. Chạm đến tương lai.</p>
                </div>
                <div>
                    <h2 className="mb-4 text-sm font-bold">Dành cho ứng viên</h2>
                    <ul className="space-y-1 text-white/80">
                        <li>
                            <Link href="/jobs" className="hover:text-white hover:underline">Tìm việc làm</Link>
                        </li>
                        <li>
                            <Link href="/#create-cv" className="hover:text-white hover:underline">Viết CV cùng TalentAI</Link>
                        </li>
                        <li>
                            <Link href="/#news" className="hover:text-white hover:underline">Cẩm nang nghề nghiệp</Link>
                        </li>
                        <li>
                            <Link href="/register" className="hover:text-white hover:underline">Tạo tài khoản miễn phí</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 className="mb-4 text-sm font-bold">Dành cho nhà tuyển dụng</h2>
                    <ul className="space-y-1 text-white/80">
                        <li>
                            <Link href="/login?role=recruiter" className="hover:text-white hover:underline">Đăng tin tuyển dụng</Link>
                        </li>
                        <li>
                            <Link href="/register?role=recruiter" className="hover:text-white hover:underline">Đăng ký nhà tuyển dụng</Link>
                        </li>
                        <li>
                            <Link href="/#companies" className="hover:text-white hover:underline">Khám phá doanh nghiệp</Link>
                        </li>
                        <li>
                            <Link href="/#industries" className="hover:text-white hover:underline">Ngành nghề nổi bật</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 className="mb-4 text-sm font-bold">Kết nối với chúng tôi</h2>
                    <div className="flex gap-2">{(["Facebook", "Instagram", "YouTube", "LinkedIn"] as const).map((name) => <AvailabilityButton key={name} title={`TalentAI trên ${name}`} description="Kênh kết nối chính thức sẽ được cập nhật trong thời gian tới. Cảm ơn bạn đã đồng hành cùng TalentAI." className="flex size-9 items-center justify-center rounded-full bg-card text-footer hover:bg-secondary">
                        <span className="sr-only">{name}</span>
                        <SocialIcon name={name} />
                    </AvailabilityButton>)}</div>
                    <h3 className="mt-5 mb-3 text-sm font-semibold">Tải ứng dụng trên điện thoại</h3>
                    <div className="flex items-center gap-3">
                        <span className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10">
                            <Smartphone className="size-8" />
                        </span>
                        <div className="grid gap-2">{["Google Play", "App Store"].map((store) => <AvailabilityButton key={store} title={`TalentAI trên ${store}`} description={appDescription} className="rounded-lg border border-white/20 bg-foreground/70 px-4 py-1.5 text-left leading-tight hover:bg-foreground">
                            <span className="block text-[10px] text-white/70">SẮP CÓ TRÊN</span>
                            <span className="text-sm font-semibold">{store}</span>
                        </AvailabilityButton>)}</div>
                    </div>
                </div>
            </div>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2 border-t border-white/15 pt-4 text-center text-xs text-white/65">
                <span className="scale-75">
                    <BrandLogo light />
                </span>
                <p>© {new Date().getFullYear()} TalentAI. Kết nối nhân tài, kiến tạo tương lai.</p>
            </div>
        </div>
    </footer>;
}
