"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth";
import { changeSavedJob, getSavedJobs } from "../services/saved-jobs";
import { savedJobKeys } from "../query-keys";
import type { SavedJob } from "../types";

export function useSavedJobs() {
    const { user } = useSession();
    return useQuery({ queryKey: savedJobKeys.list(user?.id), queryFn: ({ signal }) => getSavedJobs(signal), enabled: user?.role === "candidate" });
}

export function useSavedJobActions(callbacks?: { onSuccess?: (entry: SavedJob | null, variables: { jobId: string; saved: boolean }) => void; onError?: () => void }) {
    const { user } = useSession(); const client = useQueryClient();
    const key = savedJobKeys.list(user?.id);
    return useMutation({
        mutationKey: savedJobKeys.mutations(user?.id), mutationFn: changeSavedJob,
        onMutate: () => client.cancelQueries({ queryKey: key }),
        onSuccess: (entry, variables) => {
            client.setQueryData<SavedJob[]>(key, (previous) => {
                if (!previous) return previous;
                const rest = previous.filter((item) => item.job.id !== variables.jobId);
                return entry ? [entry, ...rest] : rest;
            });
            callbacks?.onSuccess?.(entry, variables);
        },
        onError: () => callbacks?.onError?.(),
        onSettled: () => client.invalidateQueries({ queryKey: key }),
    });
}

export function useSavedJobPending(jobId: string) {
    const { user } = useSession();
    return useIsMutating({ mutationKey: savedJobKeys.mutations(user?.id), predicate: (mutation) => (mutation.state.variables as { jobId?: string } | undefined)?.jobId === jobId }) > 0;
}
