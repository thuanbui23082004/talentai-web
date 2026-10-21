import Image from "next/image";
import { BriefcaseBusiness, Building2, UsersRound } from "lucide-react";
import { JobSearch } from "@/features/jobs";
import type { HomeContent } from "@/lib/home-content";

export function HomeHero({ statistics }: { statistics: HomeContent["statistics"] }) {
    return <section className="home-hero relative isolate overflow-hidden bg-card pt-12 pb-12 sm:pt-16 lg:pb-16">
        <div className="ui-container relative z-10">
            <div className="mx-auto max-w-4xl text-center">
                <h1 className="text-3xl leading-tight font-bold tracking-tight text-primary sm:text-4xl lg:text-[40px]">Tìm Đúng Việc – Chạm Đến Tương Lai</h1>
                <p className="mt-3 text-sm font-medium leading-relaxed text-primary sm:text-base">Kết nối nhân tài với cơ hội – Cánh cửa dẫn lối đến thành công trong sự nghiệp</p>
            </div>
            <div className="mx-auto mt-8 max-w-[1200px]">
                <JobSearch />
            </div>
            <dl className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-7 gap-y-5 text-primary sm:gap-x-12">
                {[{ label: "Công việc", value: statistics.jobs, Icon: BriefcaseBusiness }, { label: "Ứng viên", value: statistics.candidates, Icon: UsersRound }, { label: "Công ty", value: statistics.companies, Icon: Building2 }].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full bg-brand-deep text-white sm:size-13">
                        <Icon className="size-6" strokeWidth={1.6} />
                    </span>
                    <div>
                        <dd className="text-lg font-bold">{value}</dd>
                        <dt className="text-xs sm:text-sm">{label}</dt>
                    </div>
                </div>)}
            </dl>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">Số liệu và bộ sưu tập trên trang chủ dùng để minh họa giao diện.</p>
        </div>
        <Image src="/images/image 15.png" width={490} height={650} alt="" priority className="pointer-events-none absolute -bottom-5 -left-3 hidden w-40 [clip-path:inset(0_0_10%_0)] lg:block xl:w-44" />
        <Image src="/images/image 16.png" width={578} height={728} alt="" priority className="pointer-events-none absolute -right-3 -bottom-7 hidden w-44 [clip-path:inset(0_0_10%_0)] lg:block xl:w-48" />
    </section>;
}
