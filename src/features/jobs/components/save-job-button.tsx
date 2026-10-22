"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth";
import { useToast } from "@/components/ui";
import { useSavedJobActions, useSavedJobPending, useSavedJobs } from "../hooks/use-saved-jobs";
import type { Job } from "../types";

export function SaveJobButton({ job, onUnsave }: { job: Job; onUnsave?: () => void }) {
    const { user, isPending: sessionPending } = useSession(); const router = useRouter(); const { toast } = useToast();
    const query = useSavedJobs(); const pending = useSavedJobPending(job.id);
    const saved = query.data?.some((item) => item.job.id === job.id) ?? false;
    const candidate = user?.role === "candidate";
    // Hook-level callbacks still run if the saved card unmounts when its cache entry is removed.
    const action = useSavedJobActions({
        onSuccess: (_entry, variables) => {
            if (!variables.saved && onUnsave) onUnsave();
            else toast({ title: variables.saved ? "Đã lưu việc làm" : "Đã bỏ lưu việc làm", description: job.title });
        },
        onError: () => toast({ title: "Chưa thể cập nhật việc làm đã lưu", description: "Vui lòng thử lại. Danh sách của bạn chưa thay đổi.", variant: "error" }),
    });
    const label = `${saved ? "Bỏ lưu" : "Lưu"} ${job.title}`;
    const disabled = sessionPending || pending || (!!user && !candidate) || (candidate && query.isPending);
    return <button type="button" aria-label={label} aria-pressed={saved} aria-busy={pending || undefined} disabled={disabled}
        title={user && !candidate ? "Lưu việc dành cho tài khoản ứng viên" : label}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${saved ? "bg-secondary text-primary hover:bg-secondary-hover" : "bg-muted text-muted-foreground hover:bg-secondary hover:text-primary"}`}
        onClick={() => {
            if (!user) { router.push("/login"); return; }
            if (query.isError) { toast({ title: "Chưa tải được trạng thái lưu", description: "Vui lòng thử lại sau.", variant: "error" }); void query.refetch(); return; }
            action.mutate({ jobId: job.id, saved: !saved });
        }}>
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <Heart aria-hidden="true" className={`size-4 ${saved ? "fill-current" : ""}`} />}
    </button>;
}
