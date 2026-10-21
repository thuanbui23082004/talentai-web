import { useInfiniteQuery } from "@tanstack/react-query";
import { getCompanies } from "../services/companies";
import type { CompanyFilters } from "../types";
import { companyKeys } from "../query-keys";

export function useCompanies(filters: CompanyFilters, enabled: boolean) {
    return useInfiniteQuery({
        queryKey: companyKeys.list(filters),
        queryFn: ({ pageParam, signal }) => getCompanies({ ...filters, page: pageParam }, signal),
        initialPageParam: 1,
        getNextPageParam: (last) => last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
        enabled,
    });
}
