import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCompanies, getCompanyCatalogs } from "../services/companies";
import type { CompanyFilters } from "../types";
import { companyKeys } from "../query-keys";

export function useCompanyCatalogs() {
    return useQuery({
        queryKey: companyKeys.catalogs,
        queryFn: ({ signal }) => getCompanyCatalogs(signal),
        staleTime: 60000,
    });
}

export function useCompanies(filters: CompanyFilters, enabled: boolean) {
    return useInfiniteQuery({
        queryKey: companyKeys.list(filters),
        queryFn: ({ pageParam, signal }) =>
            getCompanies({ ...filters, page: pageParam }, signal),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.meta.page < last.meta.totalPages
                ? last.meta.page + 1
                : undefined,
        enabled,
    });
}
