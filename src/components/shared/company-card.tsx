import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type CompanyCardProps = { name: string; logo?: string; wordmark?: string; count?: number; href: string; tone?: number };
export function CompanyCard({ name, logo, wordmark, count, href, tone = 0 }: CompanyCardProps) {
    return <Link href={href} className="group flex min-h-[188px] min-w-0 flex-col border border-border bg-card p-3 text-foreground transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-float focus-visible:outline-2 focus-visible:outline-primary sm:min-h-60 sm:p-5">
        <div className="flex min-h-24 flex-1 items-center justify-center px-1 py-3 sm:min-h-28">{logo ? <Image src={logo} width={180} height={100} alt="" unoptimized className="max-h-24 w-full object-contain" /> : <span className={`break-words text-center text-lg leading-tight font-extrabold tracking-tight sm:text-[26px] ${tone % 3 === 0 ? "text-primary" : tone % 3 === 1 ? "text-info-foreground" : "text-success-foreground"}`}>{wordmark ?? name}</span>}</div>
        <h3 className="mt-3 truncate text-sm leading-6 font-semibold sm:text-lg" title={name}>{name}</h3>
        <p className="mt-1.5 flex items-center justify-between gap-1.5 text-[11px] leading-5 text-muted-foreground sm:text-[13px]"><span className="min-w-0 truncate">{count === undefined ? "Khám phá công ty" : `${count} việc làm đang tuyển`}</span><ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-foreground transition-transform group-hover:translate-x-1 sm:size-4" /></p>
    </Link>;
}
