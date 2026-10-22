"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth";
import { applicationKeys } from "../query-keys";
import { acceptInterview, getApplications, getInterviews } from "../services/applications";
import type { ApplicationFilters } from "../types";

export function useApplications(filters: ApplicationFilters) {
    const { user } = useSession();
    return useQuery({ queryKey: applicationKeys.list(user?.id, filters), queryFn: ({ signal }) => getApplications(filters, signal), enabled: !!user, placeholderData: keepPreviousData });
}
export function useInterviews() {
    const { user } = useSession();
    return useQuery({ queryKey: applicationKeys.interviews(user?.id), queryFn: ({ signal }) => getInterviews(signal), enabled: !!user });
}
export function useAcceptInterview() {
    const { user } = useSession(); const client = useQueryClient();
    return useMutation({ mutationFn: acceptInterview, onSuccess: () => client.invalidateQueries({ queryKey: applicationKeys.interviews(user?.id) }) });
}
