import Image from "next/image";
import { Smartphone, ArrowDownToLine } from "lucide-react";
import { AvailabilityButton } from "./availability-button";

export function AppDownloadBanner() {
    return <section aria-label="Ứng dụng TalentAI" className="relative isolate overflow-hidden rounded-2xl border border-info/10 bg-gradient-to-r from-secondary/40 via-card to-info-soft px-5 py-7 sm:px-10 sm:py-8">
        <div className="relative z-10 flex items-center gap-5 sm:gap-10">
            <div className="relative hidden h-40 w-48 shrink-0 sm:block"><Image src="/images/image 16.png" alt="" fill sizes="192px" className="object-contain" /><Smartphone aria-hidden="true" className="absolute -right-2 bottom-5 size-20 -rotate-12 rounded-2xl bg-card p-2 text-primary shadow-card" /></div>
            <div className="min-w-0 flex-1"><p className="mb-2 text-xs font-semibold tracking-widest text-primary">TALENTAI TRÊN ĐIỆN THOẠI</p><h2 className="text-xl font-extrabold tracking-tight text-brand-deep sm:text-3xl">TẢI MIỄN PHÍ ỨNG DỤNG</h2><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Tìm việc hiệu quả cùng TalentAI trên di động, sẵn sàng khám phá cơ hội mới mọi lúc, mọi nơi.</p><div className="mt-4 flex flex-wrap items-center gap-3"><AvailabilityButton title="Ứng dụng TalentAI" description="Ứng dụng TalentAI đang được hoàn thiện. Bạn có thể tìm việc và quản lý tài khoản ngay trên website bằng điện thoại." className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-brand-deep"><ArrowDownToLine className="size-4" />Khám phá ứng dụng</AvailabilityButton><span className="text-xs text-muted-foreground">Sắp có trên App Store & Google Play</span></div></div>
        </div>
    </section>;
}
