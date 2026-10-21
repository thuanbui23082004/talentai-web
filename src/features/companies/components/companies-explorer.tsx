"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button, Skeleton, Alert } from "@/components/ui";
import { CompanyCard } from "@/components/shared/company-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedStatistic } from "@/components/home/animated-statistic";
import { CompanySearch } from "./company-search";
import { parseCompanySearch } from "../schemas/search";
import { useCompanies } from "../hooks/use-companies";
import type { CompanyFilters } from "../types";
import hero from "../../../../public/images/banner/banner_company.png";

export function CompaniesExplorer() {
    const router = useRouter();
    const params = useSearchParams();
    const parsed = parseCompanySearch(params);
    const filters: CompanyFilters = parsed.success ? { ...parsed.data, page: 1 } : {};
    const { data, isPending, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } = useCompanies(filters, parsed.success);
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const active = [...params.keys()].some((key) => !["page", "pageSize"].includes(key));
    const search = (values: CompanyFilters) => {
        const next = new URLSearchParams();
        for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "" && key !== "page" && key !== "pageSize") next.set(key, String(value));
        router.push(`/companies${next.size ? `?${next}` : ""}`, { scroll: false });
    };
    return <main>
        <section className="relative isolate overflow-hidden bg-secondary/40 pt-8 pb-8 sm:pt-10 sm:pb-11" aria-labelledby="companies-title">
            <Image src={hero} alt="" fill priority sizes="100vw" className="-z-10 object-cover object-center" />
            <div className="relative z-20 mx-auto w-full max-w-[1120px] px-5 sm:px-8">
                <h1 id="companies-title" className="mx-auto max-w-5xl text-center text-[28px] leading-tight font-extrabold tracking-tight text-brand-deep sm:text-4xl lg:text-[40px]">Khám phá <span className="whitespace-nowrap text-warning"><AnimatedStatistic value="100,000" sessionKey="companies-hero-count" />+</span> công ty nổi bật</h1>
                <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-6 text-muted-foreground">Tra cứu công ty và tìm kiếm nơi làm việc phù hợp nhất với con đường phát triển tài năng của bạn.</p>
                <div className="mt-6 sm:mt-7"><CompanySearch key={params.toString()} values={filters} onSearch={search} /></div>
            </div>
            <Image src="/images/image 15.png" alt="" width={490} height={650} className="pointer-events-none absolute -bottom-7 left-0 z-10 hidden w-32 [clip-path:inset(0_0_10%_0)] xl:block" />
            <Image src="/images/image 16.png" alt="" width={578} height={728} className="pointer-events-none absolute right-0 -bottom-7 z-10 hidden w-32 xl:block" />
        </section>
        <section className="mx-auto w-full max-w-[1120px] px-5 pt-7 pb-12 sm:px-8 sm:pt-8 sm:pb-14" aria-labelledby="company-results-title">
            <div className="mb-5 border-b border-border/60 pb-4 sm:mb-7"><span className="inline-block rounded bg-secondary px-2 py-1 text-[10px] font-bold tracking-wide text-primary sm:text-[11px]">ĐƯỢC NHIỀU ỨNG VIÊN QUAN TÂM</span><div className="mt-2 flex flex-wrap items-end justify-between gap-2"><h2 id="company-results-title" className="text-lg leading-snug font-extrabold tracking-tight sm:text-2xl">{active ? "KẾT QUẢ TÌM KIẾM CÔNG TY" : "DANH SÁCH CÁC CÔNG TY NỔI BẬT"}</h2>{active && data && <p role="status" className="text-sm text-muted-foreground">Tìm thấy {data.pages[0].meta.totalItems} công ty</p>}</div></div>
            {!parsed.success && <Alert variant="error" title="Bộ lọc công ty không hợp lệ."><Button variant="outline" className="mt-3" onClick={() => search({})}>Xóa bộ lọc</Button></Alert>}
            {parsed.success && isPending && <div role="status" aria-label="Đang tải công ty" className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="h-[188px] sm:h-60" />)}</div>}
            {isError && !data && <Alert variant="error" title="Không thể tải danh sách công ty. Vui lòng thử lại."><Button variant="outline" className="mt-3" onClick={() => void refetch()}>Thử lại</Button></Alert>}
            {data && items.length === 0 && <EmptyState title="Không tìm thấy công ty" description="Thử tên khác hoặc mở rộng bộ lọc địa điểm, ngành nghề." action={<Button variant="outline" onClick={() => search({})}>Xóa bộ lọc</Button>} />}
            {items.length > 0 && <><div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">{items.map((company, index) => <CompanyCard key={company.id} name={company.name} logo={company.logoUrl} count={company.openJobsCount} href={`/companies/${company.id}`} tone={index} />)}</div>{hasNextPage && <div className="mt-7 flex flex-col items-center gap-3 sm:mt-9">{isFetchNextPageError && <p role="alert" className="text-sm text-destructive">Không tải được thêm công ty. Bạn có thể thử lại.</p>}<Button variant="outline" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()} className="rounded-full border-primary px-6 text-xs font-semibold text-primary">{isFetchingNextPage ? "Đang tải…" : isFetchNextPageError ? "Thử tải thêm công ty" : "Xem thêm công ty nổi bật"}<ChevronDown className="size-4" /></Button></div>}</>}
        </section>
    </main>;
}
