"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth";
import { applicationKeys } from "../query-keys";
import { getCandidateApplication, getCandidateApplicationHistory, listCandidateApplications, type CandidateTrackingStatus } from "../services/candidate-tracking";

export function useCandidateTracking(page: number, status?: CandidateTrackingStatus) {
    const { user } = useSession();
    return useQuery({
        queryKey: [...applicationKeys.tracking, user?.id, page, status],
        queryFn: ({ signal }) => listCandidateApplications(page, status, signal),
        enabled: Boolean(user), placeholderData: keepPreviousData, retry: false,
    });
}

export function useCandidateTrackingDetail(id: string | null) {
    const { user } = useSession();
    return useQuery({
        queryKey: [...applicationKeys.tracking, user?.id, "detail", id],
        queryFn: ({ signal }) => getCandidateApplication(id!, signal),
        enabled: Boolean(user && id), retry: false,
    });
}

export function useCandidateTrackingHistory(id: string | null) {
    const { user } = useSession();
    return useQuery({
        queryKey: [...applicationKeys.tracking, user?.id, "history", id],
        queryFn: ({ signal }) => getCandidateApplicationHistory(id!, signal),
        enabled: Boolean(user && id), retry: false,
    });
}
