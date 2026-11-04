"use client";
import { useQuery } from "@tanstack/react-query";
import { HomeCompanies } from "@/components/home/home-discovery";
import { Button } from "@/components/ui";
import { getCompanies } from "../services/companies";
import { companyKeys } from "../query-keys";
import type { CompanyPage } from "../types";

export function HomeCompanyList({ initialData }: { initialData?: CompanyPage }) {
    const query = useQuery({ queryKey: companyKeys.featured, queryFn: ({ signal }) => getCompanies({ pageSize: 8 }, signal), initialData });
    const companies = query.data?.items.map(item => ({ id: item.id, name: item.name, logo: item.logoUrl, count: item.openJobsCount })) ?? [];
    const status = query.isPending ? <p role="status">Đang tải công ty…</p> : query.isError ? <div role="alert"><p>Chưa thể tải danh sách công ty.</p><Button variant="secondary" className="mt-3" onClick={() => void query.refetch()}>Thử lại</Button></div> : !companies.length ? <p>Chưa có công ty để hiển thị.</p> : undefined;
    return <HomeCompanies companies={companies} status={status} />;
}
