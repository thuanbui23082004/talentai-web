"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { JobCard } from "@/features/jobs";
import { Alert, Button, Pagination } from "@/components/ui";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { companyKeys } from "../query-keys";
import { getCompanyJobs } from "../services/companies";

export function CompanyJobs({ companyId }: { companyId: string }) {
    const [page, setPage] = useState(1);
    const { data, isPending, isError, isFetching, refetch } = useQuery({ queryKey: companyKeys.jobs(companyId, page), queryFn: ({ signal }) => getCompanyJobs(companyId, page, signal), placeholderData: keepPreviousData });
    return <section aria-labelledby="company-jobs-title" className="space-y-4" aria-busy={isFetching}>
        <h2 id="company-jobs-title" className="text-lg font-bold">Việc đang tuyển {data && <span className="ml-1 text-sm font-medium text-primary">({data.meta.totalItems})</span>}</h2>
        {isPending && <LoadingState title="Đang tải việc làm công ty" description="Các vị trí đang tuyển sẽ sẵn sàng ngay thôi." />}
        {isError && <Alert variant="error" title="Không thể tải việc đang tuyển."><Button variant="outline" className="mt-3" onClick={() => void refetch()}>Thử lại việc làm</Button></Alert>}
        {!isError && data && (data.items.length ? <><div className="grid gap-3 md:grid-cols-2">{data.items.map((job) => <JobCard key={job.id} job={job} />)}</div>{data.meta.totalPages > 1 && <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} disabled={isFetching} />}</> : <EmptyState title="Chưa có vị trí đang tuyển" description="Bạn có thể quay lại sau để xem cơ hội mới tại công ty." />)}
    </section>;
}
