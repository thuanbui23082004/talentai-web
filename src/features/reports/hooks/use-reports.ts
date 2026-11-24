"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth";
import { createReport, getMyReports } from "../services/reports";
import type { ReportTarget, ViolationReportInput } from "../types";

export function useMyReports(page: number) {
    const { user } = useSession();
    return useQuery({ queryKey: ["my-reports", user?.id, page], queryFn: ({ signal }) => getMyReports(page, signal), enabled: user?.role === "candidate" });
}
export function useCreateReport() {
    const client = useQueryClient();
    return useMutation({ mutationFn: ({ target, input }: { target: ReportTarget; input: ViolationReportInput }) => createReport(target, input), onSuccess: () => client.invalidateQueries({ queryKey: ["my-reports"] }) });
}
